import React, { useState, useRef } from 'react'
import { Camera, Upload, X, User, Check, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { supabaseAdmin } from '../lib/supabase-admin'

interface ProfileImageUploadProps {
  currentImageUrl?: string | null
  userId: string
  onImageUpdate?: (newImageUrl: string | null) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  userId,
  onImageUpdate,
  size = 'md',
  className = ''
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-16 h-16',
      icon: 'w-6 h-6',
      uploadIcon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      container: 'w-24 h-24',
      icon: 'w-8 h-8',
      uploadIcon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      container: 'w-32 h-32',
      icon: 'w-12 h-12',
      uploadIcon: 'w-5 h-5',
      text: 'text-base'
    }
  }

  const config = sizeConfig[size]

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Bitte wählen Sie eine Bilddatei aus.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Die Datei ist zu groß. Maximal 5MB erlaubt.')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      // Create preview URL
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `profile_${userId}_${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-studies')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Fehler beim Hochladen des Bildes')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('case-studies')
        .getPublicUrl(filePath)

      // Update user profile in database
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({ profile_image_url: publicUrl })
        .eq('id', userId)

      if (dbError) {
        console.error('Database update error:', dbError)
        throw new Error('Fehler beim Speichern des Profilbilds')
      }

      // Clean up old object URL
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }

      setUploadSuccess(true)
      setPreviewUrl(publicUrl)
      onImageUpdate?.(publicUrl)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Error uploading profile image:', error)
      setUploadError(error instanceof Error ? error.message : 'Unbekannter Fehler')
      setPreviewUrl(currentImageUrl || null)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return

    setUploading(true)
    setUploadError(null)

    try {
      // Update database to remove profile image
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({ profile_image_url: null })
        .eq('id', userId)

      if (dbError) {
        throw new Error('Fehler beim Entfernen des Profilbilds')
      }

      setPreviewUrl(null)
      onImageUpdate?.(null)
      setUploadSuccess(true)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Error removing profile image:', error)
      setUploadError(error instanceof Error ? error.message : 'Fehler beim Entfernen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Profile Image Display */}
      <div className="flex items-center space-x-4">
        <div className={`${config.container} relative rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center`}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profilbild"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className={`${config.icon} text-gray-400`} />
          )}
          
          {/* Upload Status Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
          
          {/* Success Overlay */}
          {uploadSuccess && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-80 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFileSelect}
              disabled={uploading}
              className={`inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white ${config.text} rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Lädt hoch...
                </>
              ) : (
                <>
                  <Camera className={config.uploadIcon} />
                  {previewUrl ? 'Bild ändern' : 'Bild hochladen'}
                </>
              )}
            </button>

            {previewUrl && !uploading && (
              <button
                onClick={handleRemoveImage}
                className={`inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white ${config.text} rounded-lg hover:bg-red-700 transition-colors`}
              >
                <X className={config.uploadIcon} />
                Entfernen
              </button>
            )}
          </div>

          <p className={`${config.text} text-gray-500`}>
            JPG, PNG oder GIF. Maximal 5MB.
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Success Message */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Profilbild erfolgreich {previewUrl ? 'aktualisiert' : 'entfernt'}!
          </span>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-800">{uploadError}</span>
        </div>
      )}
    </div>
  )
}

export default ProfileImageUpload
