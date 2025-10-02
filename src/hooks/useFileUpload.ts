import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  uploadId?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf', 'text/plain', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Archives
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  // Audio/Video (small files only)
  'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'
];

export const useFileUpload = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Datei ist zu groß. Maximum: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
      };
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Dateityp nicht unterstützt: ${file.type}`
      };
    }

    return { valid: true };
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<FileUploadResult> => {
    if (!user) {
      return { success: false, error: 'Benutzer nicht angemeldet' };
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Generate unique file name
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `${timestamp}_${randomId}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('📤 Uploading file:', file.name, 'to path:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        let errorMessage = 'Upload fehlgeschlagen';
        
        if (uploadError.message.includes('Bucket not found')) {
          errorMessage = 'Storage Bucket nicht gefunden. Bitte wende dich an den Administrator.';
        } else if (uploadError.message.includes('File size')) {
          errorMessage = 'Datei ist zu groß. Maximum: 10MB';
        } else if (uploadError.message.includes('not allowed')) {
          errorMessage = 'Dateityp nicht erlaubt';
        } else {
          errorMessage = `Upload fehlgeschlagen: ${uploadError.message}`;
        }
        
        return { success: false, error: errorMessage };
      }

      console.log('✅ File uploaded successfully:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // Record upload in database
      const { data: dbData, error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: fileUrl,
          upload_path: filePath,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        // Try to clean up uploaded file
        await supabase.storage.from('chat-attachments').remove([filePath]);
        return { success: false, error: `Datenbank-Fehler: ${dbError.message}` };
      }

      console.log('✅ Upload recorded in database:', dbData);

      setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 });

      return {
        success: true,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadId: dbData.id
      };

    } catch (error) {
      console.error('❌ Upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Upload' 
      };
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 2000); // Clear progress after 2 seconds
    }
  }, [user, validateFile]);

  const deleteFile = useCallback(async (uploadId: string, filePath: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('chat-attachments')
        .remove([filePath]);

      if (storageError) {
        console.error('❌ Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', uploadId)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('❌ Database deletion error:', dbError);
        return false;
      }

      console.log('✅ File deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Delete error:', error);
      return false;
    }
  }, [user]);

  const getFileIcon = useCallback((fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📋';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '🗜️';
    return '📎';
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    uploadFile,
    deleteFile,
    validateFile,
    getFileIcon,
    formatFileSize,
    isUploading,
    uploadProgress,
    maxFileSize: MAX_FILE_SIZE,
    allowedFileTypes: ALLOWED_FILE_TYPES
  };
};
