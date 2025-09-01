import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Download,
  Upload,
  Eye,
  X,
  Settings
} from 'lucide-react';

interface CaseStudyRequest {
  id: string;
  user_id: string;
  case_study_number: number;
  study_phase: string;
  legal_area: string;
  sub_area: string;
  focus_area: string;
  status: 'requested' | 'materials_ready' | 'submitted' | 'under_review' | 'corrected' | 'completed';
  pdf_url?: string;
  case_study_material_url?: string;
  additional_materials_url?: string;
  submission_url?: string;
  submission_downloaded_at?: string;
  video_correction_url?: string;
  written_correction_url?: string;
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

interface Submission {
  id: string;
  case_study_request_id: string;
  file_url: string;
  file_type: 'pdf' | 'docx';
  submitted_at: string;
  correction_video_url?: string;
  grade?: number;
  grade_text?: string;
  status: 'submitted' | 'under_review' | 'corrected';
  case_study_request: {
    title: string;
    legal_area: string;
    sub_area: string;
    focus_area: string;
    user: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    } | null;
  };
}

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'materials_sent' | 'submissions' | 'pending_videos' | 'completed'>('requests');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [uploadData, setUploadData] = useState({
    videoUrl: '',
    grade: '',
    gradeText: ''
  });
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [additionalMaterialModalOpen, setAdditionalMaterialModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CaseStudyRequest | null>(null);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [additionalMaterialFile, setAdditionalMaterialFile] = useState<File | null>(null);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedCaseForCorrection, setSelectedCaseForCorrection] = useState<CaseStudyRequest | null>(null);
  const [correctionPdfFile, setCorrectionPdfFile] = useState<File | null>(null);
  const [videoLoomUrl, setVideoLoomUrl] = useState('');
  const [requests, setRequests] = useState<CaseStudyRequest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<{[key: string]: {grade: number, gradeText?: string}}>({});
  const [materialUrl, setMaterialUrl] = useState('');
  const [additionalMaterialUrl, setAdditionalMaterialUrl] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const createTestData = async () => {
    try {
      // First, ensure we have a test user
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'test@student.de')
        .single();

      let userId = existingUser?.id;

      if (!userId) {
        // Create a test user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: 'test@student.de',
            first_name: 'Max',
            last_name: 'Mustermann',
            role: 'student',
            account_credits: 5
          })
          .select('id')
          .single();

        if (userError) {
          console.error('Error creating test user:', userError);
          return;
        }
        userId = newUser.id;
      }

      // Create test case study requests
      const testRequests = [
        {
          user_id: userId,
          case_study_number: 1,
          study_phase: '1. Semester',
          legal_area: 'Zivilrecht',
          sub_area: 'BGB AT',
          focus_area: 'Willenserklärung',
          status: 'requested'
        },
        {
          user_id: userId,
          case_study_number: 2,
          study_phase: '2. Semester',
          legal_area: 'Strafrecht',
          sub_area: 'Strafrecht AT',
          focus_area: 'Tatbestand',
          status: 'materials_ready'
        },
        {
          user_id: userId,
          case_study_number: 3,
          study_phase: '3. Semester',
          legal_area: 'Öffentliches Recht',
          sub_area: 'Staatsrecht',
          focus_area: 'Grundrechte',
          status: 'submitted'
        }
      ];

      const { error: requestsError } = await supabase
        .from('case_study_requests')
        .insert(testRequests);

      if (requestsError) {
        console.error('Error creating test requests:', requestsError);
      } else {
        console.log('Test data created successfully');
      }
    } catch (error) {
      console.error('Error in createTestData:', error);
    }
  };

  const fetchData = async () => {
    try {
      // Debug: Check users and case study requests separately
      const { data: usersCheck } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .limit(10);
      
      console.log('Available users:', usersCheck);

      const { data: requestsCheck } = await supabase
        .from('case_study_requests')
        .select('id, user_id, legal_area, sub_area')
        .limit(10);
      
      console.log('Available case study requests:', requestsCheck);

      // Fetch case study requests with user data
      const { data: requestsData, error: requestsError } = await supabase
        .from('case_study_requests')
        .select(`
          *,
          user:users!case_study_requests_user_id_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        throw requestsError;
      }

      console.log('Fetched requests with user data:', requestsData);
      
      // Check if any requests have missing user data
      if (requestsData && requestsData.length > 0) {
        const requestsWithoutUsers = requestsData.filter(req => !req.user);
        if (requestsWithoutUsers.length > 0) {
          console.log('Found requests without user data:', requestsWithoutUsers);
          console.log('This indicates RLS policy issues or missing user records in the users table');
          
          // For debugging: show user_id values for requests without user data
          requestsWithoutUsers.forEach(req => {
            console.log(`Request ${req.id} has user_id: ${req.user_id} but no user data`);
          });
        }
        setRequests(requestsData || []);
      } else {
        setRequests([]);
      }

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);

      // Fetch existing grades for display
      const gradesMap: {[key: string]: {grade: number, gradeText?: string}} = {};
      submissionsData?.forEach(submission => {
        if (submission.grade) {
          gradesMap[submission.case_study_request_id] = {
            grade: submission.grade,
            gradeText: submission.grade_text
          };
        }
      });
      setGrades(gradesMap);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('case_study_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh data to update all tabs
      fetchData();
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const updateGrade = async (requestId: string, grade: number, gradeText?: string) => {
    try {
      // First check if a submission exists for this case study
      const { data: existingSubmission, error: fetchError } = await supabase
        .from('submissions')
        .select('id')
        .eq('case_study_request_id', requestId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingSubmission) {
        // Update existing submission
        const { error } = await supabase
          .from('submissions')
          .update({ 
            grade: grade,
            grade_text: gradeText || null
          })
          .eq('case_study_request_id', requestId);

        if (error) throw error;
      } else {
        // Create new submission entry
        const { error } = await supabase
          .from('submissions')
          .insert({
            case_study_request_id: requestId,
            file_url: 'placeholder-url',
            file_type: 'pdf',
            status: 'corrected',
            grade: grade,
            grade_text: gradeText || null,
            corrected_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Refresh data to update display
      fetchData();
      alert('Note erfolgreich gespeichert!');
    } catch (error) {
      console.error('Error updating grade:', error);
      alert('Fehler beim Speichern der Note');
    }
  };

  const handleDownloadSubmission = async (caseStudyId: string, submissionUrl: string) => {
    try {
      // Mark submission as downloaded and move to under_review status
      const { error } = await supabase
        .from('case_study_requests')
        .update({ 
          submission_downloaded_at: new Date().toISOString(),
          status: 'under_review'
        })
        .eq('id', caseStudyId);

      if (error) throw error;

      // Open the file in a new tab
      window.open(submissionUrl, '_blank');
      
      // Refresh data to update tabs
      fetchData();
    } catch (error) {
      console.error('Error marking submission as downloaded:', error);
      alert('Fehler beim Herunterladen der Bearbeitung');
    }
  };

  const openCorrectionModal = (caseStudy: CaseStudyRequest) => {
    setSelectedCaseForCorrection(caseStudy);
    setCorrectionModalOpen(true);
  };

  const closeCorrectionModal = () => {
    setCorrectionModalOpen(false);
    setSelectedCaseForCorrection(null);
    setVideoLoomUrl('');
    setCorrectionPdfFile(null);
  };

  const handleCorrectionUpload = async () => {
    if (!selectedCaseForCorrection || (!videoLoomUrl && !correctionPdfFile)) {
      alert('Bitte geben Sie mindestens einen Loom-Video-Link oder eine PDF-Datei an.');
      return;
    }

    try {
      let pdfUrl = null;

      // Validate Loom URL if provided
      if (videoLoomUrl) {
        const loomUrlPattern = /^https:\/\/(www\.)?loom\.com\/(share|embed)\/[a-zA-Z0-9]+/;
        if (!loomUrlPattern.test(videoLoomUrl)) {
          alert('Bitte geben Sie eine gültige Loom-URL ein (z.B. https://www.loom.com/share/...)');
          return;
        }
      }

      // Upload PDF file if provided
      if (correctionPdfFile) {
        // Validate PDF file type
        if (correctionPdfFile.type !== 'application/pdf') {
          alert('Bitte wählen Sie eine PDF-Datei aus.');
          return;
        }

        // Validate file size (max 10MB for PDF)
        const maxPdfSize = 10 * 1024 * 1024; // 10MB
        if (correctionPdfFile.size > maxPdfSize) {
          alert('Die PDF-Datei ist zu groß. Maximale Dateigröße: 10MB');
          return;
        }

        const pdfFileName = `${selectedCaseForCorrection.id}_written_correction_${Date.now()}.pdf`;
        const { data: pdfData, error: pdfError } = await supabase.storage
          .from('case-studies')
          .upload(pdfFileName, correctionPdfFile);

        if (pdfError) throw pdfError;

        const { data: pdfUrlData } = supabase.storage
          .from('case-studies')
          .getPublicUrl(pdfFileName);
        
        pdfUrl = pdfUrlData.publicUrl;
      }

      // Update case study request with correction URLs and set status to completed
      const updateData: any = {
        status: 'completed'
      };
      
      if (videoLoomUrl) updateData.video_correction_url = videoLoomUrl;
      if (pdfUrl) updateData.written_correction_url = pdfUrl;

      const { error: updateError } = await supabase
        .from('case_study_requests')
        .update(updateData)
        .eq('id', selectedCaseForCorrection.id);

      if (updateError) throw updateError;

      alert('Korrektur erfolgreich hochgeladen!');
      closeCorrectionModal();
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error uploading correction:', error);
      alert('Fehler beim Hochladen der Korrektur.');
    }
  };

  const openMaterialModal = (request: CaseStudyRequest) => {
    setSelectedRequest(request);
    setMaterialUrl(request.case_study_material_url || '');
    setMaterialModalOpen(true);
  };

  const closeMaterialModal = () => {
    setMaterialModalOpen(false);
    setSelectedRequest(null);
    setMaterialUrl('');
    setMaterialFile(null);
  };

  const openAdditionalMaterialModal = (request: CaseStudyRequest) => {
    setSelectedRequest(request);
    setAdditionalMaterialUrl(request.additional_materials_url || '');
    setAdditionalMaterialModalOpen(true);
  };

  const closeAdditionalMaterialModal = () => {
    setAdditionalMaterialModalOpen(false);
    setSelectedRequest(null);
    setAdditionalMaterialUrl('');
    setAdditionalMaterialFile(null);
  };

  // Remove material function
  const removeMaterial = async (requestId: string, materialType: 'sachverhalt' | 'zusatzmaterial') => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Datei entfernen möchten?')) {
      return;
    }

    try {
      const updateData: any = {};
      if (materialType === 'sachverhalt') {
        updateData.case_study_material_url = null;
      } else {
        updateData.additional_materials_url = null;
      }

      const { error } = await supabase
        .from('case_study_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      alert('Datei erfolgreich entfernt!');
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error removing material:', error);
      alert('Fehler beim Entfernen der Datei.');
    }
  };

  const handleMaterialUpload = async () => {
    if (!selectedRequest || !materialFile) {
      alert('Bitte wählen Sie eine PDF-Datei aus.');
      return;
    }

    try {
      console.log('Starting material upload for request:', selectedRequest.id);
      console.log('Current user:', user?.id);
      console.log('File details:', { name: materialFile.name, size: materialFile.size, type: materialFile.type });

      // Validate file type
      if (materialFile.type !== 'application/pdf') {
        alert('Bitte wählen Sie eine PDF-Datei aus.');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (materialFile.size > maxSize) {
        alert('Die Datei ist zu groß. Maximale Dateigröße: 10MB');
        return;
      }

      // Check user role before proceeding
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (userError) {
        console.error('User role check error:', userError);
        alert('Fehler beim Überprüfen der Benutzerrolle.');
        return;
      }

      console.log('User role:', userData?.role);

      if (!userData || !['instructor', 'admin'].includes(userData.role)) {
        alert('Sie haben keine Berechtigung, Sachverhalte hochzuladen.');
        return;
      }

      // Upload file to Supabase Storage
      const fileName = `${selectedRequest.id}_sachverhalt_${Date.now()}.pdf`;
      console.log('Uploading file with name:', fileName);
      
      const { data, error } = await supabase.storage
        .from('case-studies')
        .upload(fileName, materialFile);

      if (error) {
        console.error('Upload error:', error);
        alert(`Fehler beim Hochladen der Datei: ${error.message}`);
        return;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('case-studies')
        .getPublicUrl(fileName);
      
      const fileUrl = urlData.publicUrl;
      console.log('Generated public URL:', fileUrl);

      // Update case study request with file URL - preserve status if already completed
      const updateData: any = { case_study_material_url: fileUrl };
      if (selectedRequest.status !== 'completed') {
        updateData.status = 'materials_ready';
      }

      console.log('Updating case study request with data:', updateData);

      const { error: updateError } = await supabase
        .from('case_study_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (updateError) {
        console.error('Update error:', updateError);
        alert(`Fehler beim Aktualisieren des Sachverhalts: ${updateError.message}`);
        return;
      }

      console.log('Case study request updated successfully');
      alert('Sachverhalt erfolgreich hochgeladen und für Studenten verfügbar!');
      setMaterialModalOpen(false);
      setMaterialFile(null);
      setMaterialUrl('');
      fetchData(); // Refresh the requests
    } catch (error) {
      console.error('Unexpected error:', error);
      alert(`Ein unerwarteter Fehler ist aufgetreten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  const handleAdditionalMaterialUpload = async () => {
    if (!selectedRequest || !additionalMaterialFile) {
      alert('Bitte wählen Sie eine PDF-Datei aus.');
      return;
    }

    try {
      if (additionalMaterialFile.type !== 'application/pdf') {
        alert('Bitte wählen Sie nur PDF-Dateien aus.');
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (additionalMaterialFile.size > maxSize) {
        alert('Die Datei ist zu groß. Maximale Dateigröße: 10MB');
        return;
      }
      
      const fileName = `zusatzmaterial_${selectedRequest.id}_${Date.now()}.pdf`;
      const { data, error: uploadError } = await supabase.storage
        .from('case-studies')
        .upload(fileName, additionalMaterialFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('case-studies')
        .getPublicUrl(fileName);

      // Update additional materials URL - don't change status if already completed
      const updateData: any = { additional_materials_url: publicUrl };
      
      const { error } = await supabase
        .from('case_study_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      fetchData();
      closeAdditionalMaterialModal();
      alert('Zusatzmaterialien erfolgreich hochgeladen und für Studenten verfügbar!');
    } catch (error) {
      console.error('Error uploading additional material:', error);
      alert('Fehler beim Hochladen.');
    }
  };



  const openUploadModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setUploadData({
      videoUrl: submission.correction_video_url || '',
      grade: submission.grade?.toString() || '',
      gradeText: submission.grade_text || ''
    });
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedSubmission(null);
    setUploadData({ videoUrl: '', grade: '', gradeText: '' });
  };

  const handleVideoUpload = async () => {
    if (!selectedSubmission || !uploadData.videoUrl || !uploadData.grade) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          correction_video_url: uploadData.videoUrl,
          grade: parseFloat(uploadData.grade),
          grade_text: uploadData.gradeText,
          status: 'corrected'
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Also update the case study request status
      await supabase
        .from('case_study_requests')
        .update({ status: 'corrected' })
        .eq('id', selectedSubmission.case_study_request_id);

      fetchData();
      closeUploadModal();
      alert('Video erfolgreich hochgeladen und Note eingetragen!');
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Fehler beim Hochladen. Bitte versuchen Sie es erneut.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      requested: { label: 'Angefragt', color: 'bg-yellow-100 text-yellow-800' },
      materials_ready: { label: 'Sachverhalt hochgeladen', color: 'bg-blue-100 text-blue-800' },
      submitted: { label: 'Eingereicht', color: 'bg-purple-100 text-purple-800' },
      under_review: { label: 'Videokorrektur ausstehend', color: 'bg-orange-100 text-orange-800' },
      corrected: { label: 'Korrigiert', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
      { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Filter data for different tabs
  const pendingRequests = requests.filter(r => r.status === 'requested');
  const materialsSentCases = requests.filter(r => r.status === 'materials_ready');
  const submittedCases = requests.filter(r => r.status === 'submitted');
  const pendingVideoCorrections = requests.filter(r => r.status === 'under_review');
  const completedCases = requests.filter(r => r.status === 'completed');

  const stats = {
    totalRequests: pendingRequests.length,
    materialsSent: materialsSentCases.length,
    submittedCases: submittedCases.length,
    pendingVideos: pendingVideoCorrections.length,
    completedCases: completedCases.length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kraatz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dozenten-Dashboard</h1>
              <p className="text-gray-600 text-sm sm:text-base">Verwalten Sie Klausur-Anfragen und Einreichungen</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Klausur-Anfragen</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.totalRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Upload className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Sachverhalt hochgeladen</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.materialsSent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Eingereichte Klausuren</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.submittedCases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Upload className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Videokorrektur ausstehend</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.pendingVideos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Abgeschlossene Klausuren</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.completedCases}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'requests'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Klausur-Anfragen</span>
                <span className="sm:hidden">Anfragen</span>
                {pendingRequests.length > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('materials_sent')}
                className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'materials_sent'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Sachverhalt hochgeladen</span>
                <span className="sm:hidden">Sachverhalt</span>
                {materialsSentCases.length > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {materialsSentCases.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'submissions'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Eingereichte Klausuren</span>
                <span className="sm:hidden">Einreichungen</span>
                {submittedCases.length > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {submittedCases.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('pending_videos')}
                className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'pending_videos'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Videokorrektur ausstehend</span>
                <span className="sm:hidden">Videos</span>
                {pendingVideoCorrections.length > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {pendingVideoCorrections.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'completed'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Abgeschlossene Klausuren</span>
                <span className="sm:hidden">Fertig</span>
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Tab Content */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Noch keine Klausur-Anfragen vorhanden.</p>
                ) : (
                  pendingRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-kraatz-primary text-white text-xs font-bold px-2 py-1 rounded">
                              #{request.case_study_number}
                            </span>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{request.legal_area} - {request.sub_area}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {request.user ? 
                              `${[request.user.first_name, request.user.last_name].filter(Boolean).join(' ')} (${request.user.email})` : 
                              'Unbekannter Benutzer'
                            }
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
                            <span className="text-sm text-gray-500">Schwerpunkt: {request.focus_area}</span>
                            <span className="hidden sm:inline text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2">
                          {getStatusBadge(request.status)}
                          <div className="flex flex-col gap-3">
                            <select
                              value={request.status}
                              onChange={(e) => updateRequestStatus(request.id, e.target.value as any)}
                              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                            >
                              <option value="requested">Angefragt</option>
                              <option value="materials_ready">Sachverhalt hochgeladen</option>
                              <option value="submitted">Eingereichte Klausuren</option>
                              <option value="under_review">Videokorrektur ausstehend</option>
                              <option value="completed">Abgeschlossen</option>
                            </select>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => openMaterialModal(request)}
                                className={`flex flex-col items-center gap-1 px-3 py-2 text-xs rounded transition-colors flex-1 justify-center ${
                                  request.case_study_material_url
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  <span className="hidden sm:inline">
                                    {request.case_study_material_url ? 'Sachverhalt aktualisieren' : 'Sachverhalt hochladen'}
                                  </span>
                                  <span className="sm:hidden">
                                    {request.case_study_material_url ? '✓ Sachverhalt' : 'Sachverhalt'}
                                  </span>
                                </div>
                                {request.case_study_material_url && (
                                  <span className="text-xs text-gray-600 mt-1 truncate max-w-[120px]">
                                    {request.case_study_material_url.split('/').pop()?.split('_sachverhalt_')[0] || 'Sachverhalt'}.pdf
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => openAdditionalMaterialModal(request)}
                                className={`flex flex-col items-center gap-1 px-3 py-2 text-xs rounded transition-colors flex-1 justify-center ${
                                  request.additional_materials_url
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  <span className="hidden sm:inline">
                                    {request.additional_materials_url ? 'Zusatzmaterialien aktualisieren' : 'Zusatzmaterialien hochladen'}
                                  </span>
                                  <span className="sm:hidden">
                                    {request.additional_materials_url ? '✓ Zusatz' : 'Zusatz'}
                                  </span>
                                </div>
                                {request.additional_materials_url && (
                                  <span className="text-xs text-gray-600 mt-1 truncate max-w-[120px]">
                                    {request.additional_materials_url.split('/').pop()?.split('zusatzmaterial_')[1]?.split('_')[1] || 'Zusatzmaterial'}.pdf
                                  </span>
                                )}
                              </button>
                            </div>
                            {/* Grade Input for Requests Tab */}
                            <div className="mt-3 p-3 bg-gray-50 rounded border">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Note eingeben</h4>
                              <div className="flex flex-col gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="15"
                                  step="0.5"
                                  placeholder="Note (0-15)"
                                  value={grades[request.id]?.grade || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setGrades(prev => ({
                                      ...prev,
                                      [request.id]: {
                                        ...prev[request.id],
                                        grade: value ? parseFloat(value) : 0
                                      }
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const grade = parseFloat(e.target.value);
                                    if (grade >= 0 && grade <= 15) {
                                      updateGrade(request.id, grade, grades[request.id]?.gradeText);
                                    }
                                  }}
                                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <textarea
                                  placeholder="Notenbeschreibung (optional)"
                                  value={grades[request.id]?.gradeText || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setGrades(prev => ({
                                      ...prev,
                                      [request.id]: {
                                        ...prev[request.id],
                                        gradeText: value
                                      }
                                    }));
                                  }}
                                  onBlur={() => {
                                    const currentGrade = grades[request.id];
                                    if (currentGrade?.grade) {
                                      updateGrade(request.id, currentGrade.grade, currentGrade.gradeText);
                                    }
                                  }}
                                  rows={2}
                                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'materials_sent' && (
              <div className="space-y-4">
                {materialsSentCases.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Keine Klausuren mit hochgeladenem Sachverhalt vorhanden.</p>
                ) : (
                  materialsSentCases.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-kraatz-primary text-white text-xs font-bold px-2 py-1 rounded">
                              #{request.case_study_number}
                            </span>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{request.legal_area} - {request.sub_area}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {request.user ? 
                              `${[request.user.first_name, request.user.last_name].filter(Boolean).join(' ')} (${request.user.email})` : 
                              'Unbekannter Benutzer'
                            }
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
                            <span className="text-sm text-gray-500">Schwerpunkt: {request.focus_area}</span>
                            <span className="hidden sm:inline text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2">
                          {getStatusBadge(request.status)}
                          <div className="flex flex-col gap-3">
                            <select
                              value={request.status}
                              onChange={(e) => updateRequestStatus(request.id, e.target.value as any)}
                              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                            >
                              <option value="requested">Angefragt</option>
                              <option value="materials_ready">Sachverhalt hochgeladen</option>
                              <option value="submitted">Eingereichte Klausuren</option>
                              <option value="under_review">Videokorrektur ausstehend</option>
                              <option value="completed">Abgeschlossen</option>
                            </select>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => openMaterialModal(request)}
                                className={`flex flex-col items-center gap-1 px-3 py-2 text-xs rounded transition-colors flex-1 justify-center ${
                                  request.case_study_material_url
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  <span className="hidden sm:inline">
                                    {request.case_study_material_url ? 'Sachverhalt aktualisieren' : 'Sachverhalt hochladen'}
                                  </span>
                                  <span className="sm:hidden">
                                    {request.case_study_material_url ? '✓ Sachverhalt' : 'Sachverhalt'}
                                  </span>
                                </div>
                                {request.case_study_material_url && (
                                  <span className="text-xs text-gray-600 mt-1 truncate max-w-[120px]">
                                    {request.case_study_material_url.split('/').pop()?.split('_sachverhalt_')[0] || 'Sachverhalt'}.pdf
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => openAdditionalMaterialModal(request)}
                                className={`flex flex-col items-center gap-1 px-3 py-2 text-xs rounded transition-colors flex-1 justify-center ${
                                  request.additional_materials_url
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  <span className="hidden sm:inline">
                                    {request.additional_materials_url ? 'Zusatzmaterialien aktualisieren' : 'Zusatzmaterialien hochladen'}
                                  </span>
                                  <span className="sm:hidden">
                                    {request.additional_materials_url ? '✓ Zusatz' : 'Zusatz'}
                                  </span>
                                </div>
                                {request.additional_materials_url && (
                                  <span className="text-xs text-gray-600 mt-1 truncate max-w-[120px]">
                                    {request.additional_materials_url.split('/').pop()?.split('zusatzmaterial_')[1]?.split('_')[1] || 'Zusatzmaterial'}.pdf
                                  </span>
                                )}
                              </button>
                            </div>
                            {/* Grade Input for Materials Sent Tab */}
                            <div className="mt-3 p-3 bg-gray-50 rounded border">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Note eingeben</h4>
                              <div className="flex flex-col gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="15"
                                  step="0.5"
                                  placeholder="Note (0-15)"
                                  value={grades[request.id]?.grade || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setGrades(prev => ({
                                      ...prev,
                                      [request.id]: {
                                        ...prev[request.id],
                                        grade: value ? parseFloat(value) : 0
                                      }
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const grade = parseFloat(e.target.value);
                                    if (grade >= 0 && grade <= 15) {
                                      updateGrade(request.id, grade, grades[request.id]?.gradeText);
                                    }
                                  }}
                                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <textarea
                                  placeholder="Notenbeschreibung (optional)"
                                  value={grades[request.id]?.gradeText || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setGrades(prev => ({
                                      ...prev,
                                      [request.id]: {
                                        ...prev[request.id],
                                        gradeText: value
                                      }
                                    }));
                                  }}
                                  onBlur={() => {
                                    const currentGrade = grades[request.id];
                                    if (currentGrade?.grade) {
                                      updateGrade(request.id, currentGrade.grade, currentGrade.gradeText);
                                    }
                                  }}
                                  rows={2}
                                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-4">
                {submittedCases.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Noch keine Klausur-Einreichungen vorhanden.</p>
                ) : (
                  submittedCases.map((caseStudy) => (
                    <div key={caseStudy.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {caseStudy.legal_area} - {caseStudy.sub_area}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {caseStudy.user ? `${caseStudy.user.first_name || 'Demo'} ${caseStudy.user.last_name || ''} (${caseStudy.user.email})` : 'Demo (demo@kraatz-club.de)'}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Schwerpunkt: {caseStudy.focus_area}
                          </p>
                          <p className="text-sm text-gray-500">
                            Eingereicht: {new Date(caseStudy.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2">
                          {getStatusBadge(caseStudy.status)}
                          <div className="flex flex-col gap-3">
                            <select
                              value={caseStudy.status}
                              onChange={(e) => updateRequestStatus(caseStudy.id, e.target.value as any)}
                              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                            >
                              <option value="requested">Angefragt</option>
                              <option value="materials_ready">Sachverhalt hochgeladen</option>
                              <option value="submitted">Eingereichte Klausuren</option>
                              <option value="under_review">Videokorrektur ausstehend</option>
                              <option value="completed">Abgeschlossen</option>
                            </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownloadSubmission(caseStudy.id, caseStudy.submission_url!)}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 w-full sm:w-auto justify-center"
                            >
                              <Download className="w-3 h-3" />
                              Bearbeitung herunterladen
                            </button>
                          </div>
                          {/* Grade Input for Submissions Tab */}
                          <div className="mt-3 p-3 bg-gray-50 rounded border">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Note eingeben</h4>
                            <div className="flex flex-col gap-2">
                              <input
                                type="number"
                                min="0"
                                max="15"
                                step="0.5"
                                placeholder="Note (0-15)"
                                value={grades[caseStudy.id]?.grade || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setGrades(prev => ({
                                    ...prev,
                                    [caseStudy.id]: {
                                      ...prev[caseStudy.id],
                                      grade: value ? parseFloat(value) : 0
                                    }
                                  }));
                                }}
                                onBlur={(e) => {
                                  const grade = parseFloat(e.target.value);
                                  if (grade >= 0 && grade <= 15) {
                                    updateGrade(caseStudy.id, grade, grades[caseStudy.id]?.gradeText);
                                  }
                                }}
                                className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                              <textarea
                                placeholder="Notenbeschreibung (optional)"
                                value={grades[caseStudy.id]?.gradeText || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setGrades(prev => ({
                                    ...prev,
                                    [caseStudy.id]: {
                                      ...prev[caseStudy.id],
                                      gradeText: value
                                    }
                                  }));
                                }}
                                onBlur={() => {
                                  const currentGrade = grades[caseStudy.id];
                                  if (currentGrade?.grade) {
                                    updateGrade(caseStudy.id, currentGrade.grade, currentGrade.gradeText);
                                  }
                                }}
                                rows={2}
                                className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                              />
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'pending_videos' && (
              <div className="space-y-4">
                {pendingVideoCorrections.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Keine ausstehenden Videokorrekturen vorhanden.</p>
                ) : (
                  pendingVideoCorrections.map((caseStudy) => (
                    <div key={caseStudy.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {caseStudy.legal_area} - {caseStudy.sub_area}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {caseStudy.user ? 
                              `${[caseStudy.user.first_name, caseStudy.user.last_name].filter(Boolean).join(' ')} (${caseStudy.user.email})` : 
                              'Unbekannter Benutzer'
                            }
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Schwerpunkt: {caseStudy.focus_area}
                          </p>
                          <p className="text-sm text-gray-500">
                            Heruntergeladen: {caseStudy.submission_downloaded_at ? new Date(caseStudy.submission_downloaded_at).toLocaleDateString('de-DE') : 'Noch nicht heruntergeladen'}
                          </p>
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-2">
                          {getStatusBadge(caseStudy.status)}
                          <div className="flex flex-col gap-3">
                            <select
                              value={caseStudy.status}
                              onChange={(e) => updateRequestStatus(caseStudy.id, e.target.value as any)}
                              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                            >
                              <option value="requested">Angefragt</option>
                              <option value="materials_ready">Sachverhalt hochgeladen</option>
                              <option value="submitted">Eingereichte Klausuren</option>
                              <option value="under_review">Videokorrektur ausstehend</option>
                              <option value="completed">Abgeschlossen</option>
                            </select>
                          <div className="flex gap-2">
                            <a
                              href={caseStudy.submission_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              <Download className="w-3 h-3" />
                              Bearbeitung ansehen
                            </a>
                            <button
                              onClick={() => openCorrectionModal(caseStudy)}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              <Upload className="w-3 h-3" />
                              Korrektur hochladen
                            </button>
                          </div>
                          {/* Grade Input for Pending Videos Tab */}
                          <div className="mt-3 p-3 bg-gray-50 rounded border">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Note eingeben</h4>
                            <div className="flex flex-col gap-2">
                              <input
                                type="number"
                                min="0"
                                max="15"
                                step="0.5"
                                placeholder="Note (0-15)"
                                value={grades[caseStudy.id]?.grade || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setGrades(prev => ({
                                    ...prev,
                                    [caseStudy.id]: {
                                      ...prev[caseStudy.id],
                                      grade: value ? parseFloat(value) : 0
                                    }
                                  }));
                                }}
                                onBlur={(e) => {
                                  const grade = parseFloat(e.target.value);
                                  if (grade >= 0 && grade <= 15) {
                                    updateGrade(caseStudy.id, grade, grades[caseStudy.id]?.gradeText);
                                  }
                                }}
                                className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                              <textarea
                                placeholder="Notenbeschreibung (optional)"
                                value={grades[caseStudy.id]?.gradeText || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setGrades(prev => ({
                                    ...prev,
                                    [caseStudy.id]: {
                                      ...prev[caseStudy.id],
                                      gradeText: value
                                    }
                                  }));
                                }}
                                onBlur={() => {
                                  const currentGrade = grades[caseStudy.id];
                                  if (currentGrade?.grade) {
                                    updateGrade(caseStudy.id, currentGrade.grade, currentGrade.gradeText);
                                  }
                                }}
                                rows={2}
                                className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                              />
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-4">
                {completedCases.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Noch keine abgeschlossenen Klausuren vorhanden.</p>
                ) : (
                  completedCases.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{request.legal_area} - {request.sub_area}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {request.user ? 
                                `${[request.user.first_name, request.user.last_name].filter(Boolean).join(' ')} (${request.user.email})` : 
                                'Unbekannter Benutzer'
                              }
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-500">Schwerpunkt: {request.focus_area}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {new Date(request.created_at).toLocaleDateString('de-DE')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex flex-col items-end gap-2">
                            {getStatusBadge(request.status)}
                            <div className="flex flex-col gap-3">
                              <select
                                value={request.status}
                                onChange={(e) => updateRequestStatus(request.id, e.target.value as any)}
                                className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                              >
                                <option value="requested">Angefragt</option>
                                <option value="materials_ready">Sachverhalt hochgeladen</option>
                                <option value="submitted">Eingereichte Klausuren</option>
                                <option value="under_review">Videokorrektur ausstehend</option>
                                <option value="completed">Abgeschlossen</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* All Materials Section - Always Visible */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <h4 className="font-medium text-gray-900 mb-3">Alle Materialien & Korrekturen</h4>
                          
                          {/* Row 1: Sachverhalt and Additional Materials */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Sachverhalt</label>
                              {request.case_study_material_url && (
                                <div className="text-xs text-gray-600 mb-1">
                                  Datei: {request.case_study_material_url.split('/').pop()?.split('_sachverhalt_')[0] || 'Sachverhalt'}.pdf
                                </div>
                              )}
                              <div className="flex gap-2">
                                {request.case_study_material_url ? (
                                  <a
                                    href={request.case_study_material_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex-1 justify-center"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Ansehen
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-100 text-gray-500 rounded flex-1 justify-center">
                                    <AlertCircle className="w-3 h-3" />
                                    Nicht verfügbar
                                  </span>
                                )}
                                <button
                                  onClick={() => openMaterialModal(request)}
                                  className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  <Settings className="w-3 h-3" />
                                  Bearbeiten
                                </button>
                                {request.case_study_material_url && (
                                  <button
                                    onClick={() => removeMaterial(request.id, 'sachverhalt')}
                                    className="flex items-center gap-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  >
                                    <X className="w-3 h-3" />
                                    Entfernen
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Zusatzmaterialien</label>
                              {request.additional_materials_url && (
                                <div className="text-xs text-gray-600 mb-1">
                                  Datei: {request.additional_materials_url.split('/').pop()?.split('zusatzmaterial_')[1]?.split('_')[1] || 'Zusatzmaterial'}.pdf
                                </div>
                              )}
                              <div className="flex gap-2">
                                {request.additional_materials_url ? (
                                  <a
                                    href={request.additional_materials_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex-1 justify-center"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Ansehen
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-100 text-gray-500 rounded flex-1 justify-center">
                                    <AlertCircle className="w-3 h-3" />
                                    Nicht verfügbar
                                  </span>
                                )}
                                <button
                                  onClick={() => openAdditionalMaterialModal(request)}
                                  className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  <Settings className="w-3 h-3" />
                                  Bearbeiten
                                </button>
                                {request.additional_materials_url && (
                                  <button
                                    onClick={() => removeMaterial(request.id, 'zusatzmaterial')}
                                    className="flex items-center gap-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  >
                                    <X className="w-3 h-3" />
                                    Entfernen
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Student Submission */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Studentenbearbeitung</label>
                            <div className="flex gap-2">
                              {request.submission_url ? (
                                <a
                                  href={request.submission_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex-1 justify-center"
                                >
                                  <Download className="w-3 h-3" />
                                  Herunterladen
                                </a>
                              ) : (
                                <span className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-100 text-gray-500 rounded flex-1 justify-center">
                                  <AlertCircle className="w-3 h-3" />
                                  Nicht eingereicht
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Row 3: Corrections */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Loom Video-Korrektur</label>
                              <div className="flex gap-2">
                                {request.video_correction_url ? (
                                  <a
                                    href={request.video_correction_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex-1 justify-center"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Ansehen
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-100 text-gray-500 rounded flex-1 justify-center">
                                    <AlertCircle className="w-3 h-3" />
                                    Nicht verfügbar
                                  </span>
                                )}
                                <button
                                  onClick={() => openCorrectionModal(request)}
                                  className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  <Settings className="w-3 h-3" />
                                  Bearbeiten
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Schriftliche Korrektur (PDF)</label>
                              <div className="flex gap-2">
                                {request.written_correction_url ? (
                                  <a
                                    href={request.written_correction_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex-1 justify-center"
                                  >
                                    <Download className="w-3 h-3" />
                                    Herunterladen
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-100 text-gray-500 rounded flex-1 justify-center">
                                    <AlertCircle className="w-3 h-3" />
                                    Nicht verfügbar
                                  </span>
                                )}
                                <button
                                  onClick={() => openCorrectionModal(request)}
                                  className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  <Settings className="w-3 h-3" />
                                  Bearbeiten
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Grade Input Section */}
                          <div className="border-t pt-3 mt-3">
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700">Note vergeben</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <label className="text-xs text-gray-600">Punkte (0-15)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="15"
                                    step="0.5"
                                    placeholder="Note (0-15)"
                                    value={grades[request.id]?.grade || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setGrades(prev => ({
                                        ...prev,
                                        [request.id]: {
                                          ...prev[request.id],
                                          grade: value ? parseFloat(value) : 0
                                        }
                                      }));
                                    }}
                                    onBlur={(e) => {
                                      const grade = parseFloat(e.target.value);
                                      if (grade >= 0 && grade <= 15) {
                                        updateGrade(request.id, grade, grades[request.id]?.gradeText);
                                      }
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs text-gray-600">Notenbeschreibung (optional)</label>
                                  <textarea
                                    placeholder="Notenbeschreibung (optional)"
                                    value={grades[request.id]?.gradeText || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setGrades(prev => ({
                                        ...prev,
                                        [request.id]: {
                                          ...prev[request.id],
                                          gradeText: value
                                        }
                                      }));
                                    }}
                                    onBlur={() => {
                                      const currentGrade = grades[request.id];
                                      if (currentGrade?.grade) {
                                        updateGrade(request.id, currentGrade.grade, currentGrade.gradeText);
                                      }
                                    }}
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                  />
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                💡 Die Note wird automatisch in der Ergebnis-Statistik des Studenten angezeigt
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Material Upload Modal */}
        {materialModalOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Sachverhalt hochladen</h3>
                <button onClick={closeMaterialModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Show existing file if available */}
                {selectedRequest.case_study_material_url && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Aktuell hochgeladene Datei:</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-blue-800 font-medium">
                          {selectedRequest.case_study_material_url.split('/').pop()?.split('_sachverhalt_')[0] || 'Sachverhalt'}.pdf
                        </span>
                      </div>
                      <a
                        href={selectedRequest.case_study_material_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Ansehen
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedRequest.case_study_material_url ? 'Neue PDF-Datei hochladen (ersetzt die aktuelle)' : 'PDF-Datei hochladen'}
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      materialFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-kraatz-primary hover:bg-gray-50'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files.length > 0 && files[0].type === 'application/pdf') {
                        setMaterialFile(files[0]);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="material-file-input"
                    />
                    {materialFile ? (
                      <div className="text-green-600">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <p className="font-medium">{materialFile.name}</p>
                        <p className="text-sm text-gray-500">{(materialFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-1">PDF hier ablegen oder</p>
                        <label htmlFor="material-file-input" className="text-kraatz-primary cursor-pointer hover:underline">
                          Datei auswählen
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Nur PDF-Dateien sind erlaubt (max. 10MB)</p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeMaterialModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleMaterialUpload}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Abschicken
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Material Upload Modal */}
        {additionalMaterialModalOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Zusatzmaterialien hochladen</h3>
                <button onClick={closeAdditionalMaterialModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Show existing file if available */}
                {selectedRequest.additional_materials_url && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Aktuell hochgeladene Datei:</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-green-800 font-medium">
                          {selectedRequest.additional_materials_url.split('/').pop()?.split('zusatzmaterial_')[1]?.split('_')[1] || 'Zusatzmaterial'}.pdf
                        </span>
                      </div>
                      <a
                        href={selectedRequest.additional_materials_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                      >
                        Ansehen
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedRequest.additional_materials_url ? 'Neue PDF-Datei hochladen (ersetzt die aktuelle)' : 'PDF-Datei hochladen'}
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      additionalMaterialFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-green-500 hover:bg-gray-50'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files.length > 0 && files[0].type === 'application/pdf') {
                        setAdditionalMaterialFile(files[0]);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setAdditionalMaterialFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="additional-file-input"
                    />
                    {additionalMaterialFile ? (
                      <div className="text-green-600">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <p className="font-medium">{additionalMaterialFile.name}</p>
                        <p className="text-sm text-gray-500">{(additionalMaterialFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-1">PDF hier ablegen oder</p>
                        <label htmlFor="additional-file-input" className="text-green-600 cursor-pointer hover:underline">
                          Datei auswählen
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Nur PDF-Dateien sind erlaubt (max. 10MB)</p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeAdditionalMaterialModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleAdditionalMaterialUpload}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Abschicken
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Correction Upload Modal */}
        {correctionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Korrektur hochladen</h3>
                  <button
                    onClick={closeCorrectionModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedCaseForCorrection && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedCaseForCorrection.legal_area} - {selectedCaseForCorrection.sub_area}
                    </p>
                    <p className="text-xs text-gray-600">
                      {selectedCaseForCorrection.user ? 
                        `${[selectedCaseForCorrection.user.first_name, selectedCaseForCorrection.user.last_name].filter(Boolean).join(' ')} (${selectedCaseForCorrection.user.email})` : 
                        'Unbekannter Benutzer'
                      }
                    </p>
                  </div>
                )}

                {/* Loom Video URL Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loom Video-Korrektur (optional)
                  </label>
                  <input
                    type="url"
                    value={videoLoomUrl}
                    onChange={(e) => setVideoLoomUrl(e.target.value)}
                    placeholder="https://www.loom.com/share/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fügen Sie den Loom-Video-Link hier ein</p>
                  {videoLoomUrl && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">✓ Loom-Video-Link eingegeben</p>
                    </div>
                  )}
                </div>

                {/* PDF Upload Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schriftliche Korrektur (optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCorrectionPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="correction-pdf-input"
                  />
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => document.getElementById('correction-pdf-input')?.click()}
                  >
                    {correctionPdfFile ? (
                      <div className="text-green-600">
                        <FileText className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-medium">{correctionPdfFile.name}</p>
                        <p className="text-sm text-gray-500">{(correctionPdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2" />
                        <p className="mb-1">PDF hier ablegen oder</p>
                        <span className="text-blue-600 hover:underline">Datei auswählen</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Nur PDF-Dateien bis 10MB</p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeCorrectionModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleCorrectionUpload}
                    disabled={!videoLoomUrl && !correctionPdfFile}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Korrektur hochladen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
