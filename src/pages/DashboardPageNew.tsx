import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CreditCard, BookOpen, Plus, Download, Upload, FileText, Video, X, Clock, CheckCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

interface UserProfile {
  account_credits: number
  first_name: string
  last_name: string
}

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
  video_viewed_at?: string;
  pdf_downloaded_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

export const DashboardPageNew: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [caseStudies, setCaseStudies] = useState<CaseStudyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadingCaseId, setUploadingCaseId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null)
  const [highlightedCaseId, setHighlightedCaseId] = useState<string | null>(null)

  // Track video view
  const handleVideoView = async (caseStudyId: string) => {
    try {
      const { error } = await supabase
        .from('case_study_requests')
        .update({ video_viewed_at: new Date().toISOString() })
        .eq('id', caseStudyId)
      
      if (!error) {
        // Update local state immediately for instant UI feedback
        setCaseStudies(prevCases => 
          prevCases.map(cs => 
            cs.id === caseStudyId 
              ? { ...cs, video_viewed_at: new Date().toISOString() }
              : cs
          )
        )
        // Also refresh from database
        fetchUserData()
      }
    } catch (error) {
      console.error('Error tracking video view:', error)
    }
  }

  // Track PDF download
  const handlePdfDownload = async (caseStudyId: string) => {
    try {
      const { error } = await supabase
        .from('case_study_requests')
        .update({ pdf_downloaded_at: new Date().toISOString() })
        .eq('id', caseStudyId)
      
      if (!error) {
        // Update local state immediately for instant UI feedback
        setCaseStudies(prevCases => 
          prevCases.map(cs => 
            cs.id === caseStudyId 
              ? { ...cs, pdf_downloaded_at: new Date().toISOString() }
              : cs
          )
        )
        // Also refresh from database
        fetchUserData()
      }
    } catch (error) {
      console.error('Error tracking PDF download:', error)
    }
  }

  // Open video modal
  const openVideoModal = (videoUrl: string, caseStudyId: string) => {
    // Convert Loom share URL to embed URL
    const embedUrl = videoUrl.replace('https://www.loom.com/share/', 'https://www.loom.com/embed/')
    setCurrentVideoUrl(embedUrl)
    setVideoModalOpen(true)
    // Track video view when modal opens
    handleVideoView(caseStudyId)
  }

  // Close video modal
  const closeVideoModal = () => {
    setVideoModalOpen(false)
    setCurrentVideoUrl(null)
  }

  // Determine styling based on access status
  const getCompletedCaseStyle = (caseStudy: CaseStudyRequest) => {
    const hasVideo = !!caseStudy.video_correction_url
    const hasPdf = !!caseStudy.written_correction_url
    const videoViewed = !!caseStudy.video_viewed_at
    const pdfDownloaded = !!caseStudy.pdf_downloaded_at
    
    // Check if it's a new correction (completed recently and not accessed)
    const isNew = !videoViewed && !pdfDownloaded
    
    // Check if fully accessed
    const fullyAccessed = (!hasVideo || videoViewed) && (!hasPdf || pdfDownloaded)
    
    // Check if partially accessed
    const partiallyAccessed = (videoViewed || pdfDownloaded) && !fullyAccessed
    
    if (fullyAccessed) {
      return {
        containerClass: "border border-green-200 rounded-lg p-4 bg-green-50",
        badgeClass: "px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium",
        badgeText: "✓ Vollständig angesehen",
        showNewBadge: false
      }
    } else if (partiallyAccessed) {
      return {
        containerClass: "border border-gray-200 rounded-lg p-4 bg-gray-50",
        badgeClass: "px-2 py-1 bg-gray-600 text-white text-xs rounded-full font-medium",
        badgeText: "◐ Teilweise angesehen",
        showNewBadge: false
      }
    } else {
      return {
        containerClass: "border border-blue-200 rounded-lg p-4 bg-blue-50",
        badgeClass: "px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium",
        badgeText: "✓ Abgeschlossen",
        showNewBadge: isNew
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Handle highlight parameter from notifications
  useEffect(() => {
    const highlightId = searchParams.get('highlight')
    if (highlightId) {
      setHighlightedCaseId(highlightId)
      // Clear the parameter after a delay
      setTimeout(() => {
        setHighlightedCaseId(null)
        setSearchParams({})
      }, 5000)
      
      // Scroll to the highlighted case study
      setTimeout(() => {
        const element = document.getElementById(`case-study-${highlightId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
    }
  }, [searchParams, setSearchParams])

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('account_credits, first_name, last_name')
        .eq('id', user?.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Fetch case studies
      const { data: caseStudyData, error: caseStudyError } = await supabase
        .from('case_study_requests')
        .select('*, case_study_number')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true })

      if (caseStudyError) throw caseStudyError
      setCaseStudies(caseStudyData || [])

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const handleDragOver = (e: React.DragEvent, caseStudyId: string) => {
    e.preventDefault()
    setDragOver(caseStudyId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
  }

  const handleDrop = (e: React.DragEvent, caseStudyId: string) => {
    e.preventDefault()
    setDragOver(null)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf' || 
          file.type === 'application/msword' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setUploadFile(file)
      }
    }
  }

  const handleFileUpload = async (caseStudyId: string) => {
    if (!uploadFile) return

    setUploadingCaseId(caseStudyId)
    try {
      console.log('Starting upload for case study:', caseStudyId)
      console.log('File details:', { name: uploadFile.name, size: uploadFile.size, type: uploadFile.type })
      
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${caseStudyId}_submission_${Date.now()}.${fileExt}`
      
      console.log('Uploading to storage with filename:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-studies')
        .upload(fileName, uploadFile)

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', uploadData)

      const { data: urlData } = supabase.storage
        .from('case-studies')
        .getPublicUrl(fileName)

      console.log('Public URL generated:', urlData.publicUrl)

      const { error: updateError } = await supabase
        .from('case_study_requests')
        .update({ 
          submission_url: urlData.publicUrl,
          status: 'submitted'
        })
        .eq('id', caseStudyId)

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }

      console.log('Case study status updated successfully')
      setUploadFile(null)
      fetchUserData()
    } catch (error: any) {
      console.error('Error uploading file:', error)
      alert(`Upload failed: ${error.message || 'Unknown error occurred'}`)
    } finally {
      setUploadingCaseId(null)
    }
  }

  const availableSlots = profile?.account_credits || 0
  const requestedCases = caseStudies.filter(cs => cs.status === 'requested')
  const materialsReadyCases = caseStudies.filter(cs => cs.status === 'materials_ready')
  const submittedCases = caseStudies.filter(cs => cs.status === 'submitted')
  const correctedCases = caseStudies.filter(cs => false) // No longer used - moved to completed status
  const completedCases = caseStudies.filter(cs => cs.status === 'completed')
  
  // Separate new and viewed corrections
  const newCorrections = completedCases.filter(cs => !cs.video_viewed_at)
  const viewedCorrections = completedCases.filter(cs => cs.video_viewed_at)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Willkommen, {profile?.first_name} {profile?.last_name}!
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Hier ist Ihr persönliches Dashboard für Klausurbearbeitungen.</p>
        </div>

        {/* 1. Verfügbare Klausuren */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Verfügbare Klausuren</h2>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-kraatz-primary" />
              <span className="font-bold text-kraatz-primary">{availableSlots}</span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-gray-600 text-sm sm:text-base">
              Sie haben <span className="font-bold">{availableSlots}</span> verfügbare Klausur-Credits.
            </p>
            {availableSlots > 0 && (
              <Link
                to="/case-studies/request"
                className="bg-kraatz-primary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-kraatz-primary/90 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Sachverhalt anfordern</span>
              </Link>
            )}
          </div>
          {availableSlots === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Keine verfügbaren Credits.</p>
              <Link
                to="/packages"
                className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Weitere Klausuren buchen</span>
              </Link>
            </div>
          )}
        </div>

        {/* 2. Sachverhalt angefordert */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Sachverhalt angefordert</h2>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-yellow-600">{requestedCases.length}</span>
            </div>
          </div>
          {requestedCases.length > 0 ? (
            <div className="space-y-3">
              {requestedCases.map((caseStudy, index) => (
                <div 
                  key={caseStudy.id} 
                  id={`case-study-${caseStudy.id}`}
                  className={`border rounded-lg p-3 transition-all duration-1000 ${
                    highlightedCaseId === caseStudy.id 
                      ? 'border-blue-400 bg-blue-100 shadow-lg ring-2 ring-blue-300' 
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-kraatz-primary text-white text-xs font-bold px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <h3 className="font-medium text-gray-900">{caseStudy.legal_area} - {caseStudy.sub_area}</h3>
                      </div>
                      <p className="text-sm text-gray-600">Schwerpunkt: {caseStudy.focus_area}</p>
                      <p className="text-xs text-gray-500">Angefordert: {formatDate(caseStudy.created_at)}</p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      Warten auf Dozent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">Keine angeforderten Sachverhalte.</p>
          )}
        </div>

        {/* 3. Sachverhalt verfügbar */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Sachverhalt verfügbar</h2>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-600">{materialsReadyCases.length}</span>
            </div>
          </div>
          {materialsReadyCases.length > 0 ? (
            <div className="space-y-3">
              {materialsReadyCases.map((caseStudy) => (
                <div 
                  key={caseStudy.id} 
                  id={`case-study-${caseStudy.id}`}
                  className={`border rounded-lg p-3 transition-all duration-1000 ${
                    highlightedCaseId === caseStudy.id 
                      ? 'border-blue-400 bg-blue-100 shadow-lg ring-2 ring-blue-300' 
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-kraatz-primary text-white text-xs font-bold px-2 py-1 rounded">
                        #{caseStudy.case_study_number}
                      </span>
                      <h3 className="font-medium text-gray-900">{caseStudy.legal_area} - {caseStudy.sub_area}</h3>
                    </div>
                    <p className="text-sm text-gray-600">Schwerpunkt: {caseStudy.focus_area}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {caseStudy.case_study_material_url && (
                      <a
                        href={caseStudy.case_study_material_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Sachverhalt</span>
                      </a>
                    )}
                    {caseStudy.additional_materials_url && (
                      <a
                        href={caseStudy.additional_materials_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Zusatzmaterialien</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">Keine verfügbaren Sachverhalte.</p>
          )}
        </div>

        {/* 4. Upload Bearbeitung */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Upload Bearbeitung</h2>
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-orange-600" />
              <span className="font-bold text-orange-600">{materialsReadyCases.length + submittedCases.length}</span>
            </div>
          </div>
          {(materialsReadyCases.length > 0 || submittedCases.length > 0) ? (
            <div className="space-y-4">
              {/* Ready for upload cases */}
              {materialsReadyCases.map((caseStudy) => (
                <div 
                  key={caseStudy.id} 
                  id={`case-study-${caseStudy.id}`}
                  className={`border rounded-lg p-4 transition-all duration-1000 ${
                    highlightedCaseId === caseStudy.id 
                      ? 'border-blue-400 bg-blue-100 shadow-lg ring-2 ring-blue-300' 
                      : 'border-orange-200 bg-orange-50'
                  }`}
                >
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-kraatz-primary text-white text-xs font-bold px-2 py-1 rounded">
                        #{caseStudy.case_study_number}
                      </span>
                      <h3 className="font-medium text-gray-900">{caseStudy.legal_area} - {caseStudy.sub_area}</h3>
                    </div>
                    <p className="text-sm text-gray-600">Schwerpunkt: {caseStudy.focus_area}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bearbeitung hochladen (PDF oder Word)
                      </label>
                      <div
                        onDragOver={(e) => handleDragOver(e, caseStudy.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, caseStudy.id)}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          dragOver === caseStudy.id
                            ? 'border-kraatz-primary bg-blue-50'
                            : uploadFile
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        {uploadFile ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center space-x-2">
                              <FileText className="w-8 h-8 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-green-800">{uploadFile.name}</p>
                                <p className="text-xs text-green-600">
                                  {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <button
                                onClick={() => setUploadFile(null)}
                                className="p-1 hover:bg-green-200 rounded-full"
                              >
                                <X className="w-4 h-4 text-green-600" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                            <div>
                              <p className="text-sm text-gray-600">
                                Datei hier ablegen oder{' '}
                                <label className="text-kraatz-primary hover:text-kraatz-primary/80 cursor-pointer font-medium">
                                  durchsuchen
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                  />
                                </label>
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PDF, DOC oder DOCX (max. 10MB)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleFileUpload(caseStudy.id)}
                      disabled={!uploadFile || uploadingCaseId === caseStudy.id}
                      className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                        uploadFile && uploadingCaseId !== caseStudy.id
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {uploadingCaseId === caseStudy.id 
                          ? 'Wird hochgeladen...' 
                          : 'Bearbeitung einreichen'
                        }
                      </span>
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Submitted cases */}
              {submittedCases.map((caseStudy, index) => (
                <div 
                  key={caseStudy.id} 
                  id={`case-study-${caseStudy.id}`}
                  className={`border rounded-lg p-4 transition-all duration-1000 ${
                    highlightedCaseId === caseStudy.id 
                      ? 'border-blue-400 bg-blue-100 shadow-lg ring-2 ring-blue-300' 
                      : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-kraatz-primary text-white text-xs font-bold px-2 py-1 rounded">
                        #{caseStudy.case_study_number}
                      </span>
                      <h3 className="font-medium text-gray-900">{caseStudy.legal_area} - {caseStudy.sub_area}</h3>
                    </div>
                    <p className="text-sm text-gray-600">Schwerpunkt: {caseStudy.focus_area}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Klausurbearbeitung erfolgreich hochgeladen
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Die Video-Klausurkorrektur steht in 48 Stunden zur Verfügung.
                        </p>
                      </div>
                    </div>
                    {caseStudy.submission_url && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-xs text-gray-600">
                          Eingereicht: {formatDate(caseStudy.created_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">Keine Klausuren bereit für Upload.</p>
          )}
        </div>

        {/* 5. Video-Klausurenkorrektur verfügbar */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Video-Klausurenkorrektur verfügbar</h2>
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-600">{completedCases.length}</span>
            </div>
          </div>
          
          {completedCases.length > 0 ? (
            <>
              {/* Neue Video-Klausurenkorrekturen */}
              {newCorrections.length > 0 && (
                <div className="mb-6">
                  <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <h3 className="text-sm font-semibold text-green-800">🎉 Eine neue Klausur-Korrektur ist ab sofort für Dich verfügbar.</h3>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Neue Video-Klausurenkorrekturen</h3>
                  <div className="space-y-3">
                    {correctedCases.map((caseStudy, index) => {
                      const style = getCompletedCaseStyle(caseStudy)
                      return (
                        <div 
                          key={caseStudy.id} 
                          id={`case-study-${caseStudy.id}`}
                          className={`${style.containerClass} transition-all duration-1000 ${
                            highlightedCaseId === caseStudy.id 
                              ? 'ring-4 ring-blue-300 shadow-xl' 
                              : ''
                          }`}
                        >
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-kraatz-primary text-white text-xs font-bold px-2 py-1 rounded">
                                  #{caseStudy.case_study_number}
                                </span>
                                <h3 className="font-medium text-gray-900">{caseStudy.legal_area} - {caseStudy.sub_area}</h3>
                              </div>
                              <span className={style.badgeClass}>
                                {style.badgeText}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">Schwerpunkt: {caseStudy.focus_area}</p>
                          </div>
                          
                          <div className="bg-white p-3 rounded border border-green-200 mb-3">
                            <p className="text-sm text-green-800 font-medium mb-2">🎓 Deine Korrekturen:</p>
                            <div className="flex flex-wrap gap-2">
                              {caseStudy.video_correction_url && (
                                <button
                                  onClick={() => openVideoModal(caseStudy.video_correction_url!, caseStudy.id)}
                                  className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                                    caseStudy.video_viewed_at 
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  <Video className="w-4 h-4" />
                                  <span>Video ansehen</span>
                                  {caseStudy.video_viewed_at && <span className="text-xs">✓</span>}
                                </button>
                              )}
                              {caseStudy.written_correction_url && (
                                <a
                                  href={caseStudy.written_correction_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handlePdfDownload(caseStudy.id)}
                                  className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                                    caseStudy.pdf_downloaded_at 
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-gray-600 text-white hover:bg-gray-700'
                                  }`}
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>PDF herunterladen</span>
                                  {caseStudy.pdf_downloaded_at && <span className="text-xs">✓</span>}
                                </a>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            💡 Schaue Dir sowohl die Video-Korrektur, als auch die schriftliche Bewertung Deines Dozenten an, um einen maximalen Mehrwert in der Nachbereitung zu erhalten!
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Vergangene Video-Klausurenkorrekturen */}
              {viewedCorrections.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Vergangene Video-Klausurenkorrekturen</h3>
                  <div className="space-y-3">
                    {viewedCorrections.map((caseStudy) => {
                      const style = getCompletedCaseStyle(caseStudy)
                      return (
                        <div 
                          key={caseStudy.id} 
                          id={`case-study-${caseStudy.id}`}
                          className={`${style.containerClass} transition-all duration-1000 ${
                            highlightedCaseId === caseStudy.id 
                              ? 'ring-4 ring-blue-300 shadow-xl' 
                              : ''
                          }`}
                        >
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-kraatz-primary text-white text-xs font-bold px-2 py-1 rounded">
                                  #{caseStudy.case_study_number}
                                </span>
                                <h3 className="font-medium text-gray-900">{caseStudy.legal_area} - {caseStudy.sub_area}</h3>
                              </div>
                              <span className={style.badgeClass}>
                                {style.badgeText}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">Schwerpunkt: {caseStudy.focus_area}</p>
                          </div>
                          
                          <div className="bg-white p-3 rounded border border-green-200 mb-3">
                            <p className="text-sm text-green-800 font-medium mb-2">🎓 Deine Korrekturen:</p>
                            <div className="flex flex-wrap gap-2">
                              {caseStudy.video_correction_url && (
                                <button
                                  onClick={() => openVideoModal(caseStudy.video_correction_url!, caseStudy.id)}
                                  className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                                    caseStudy.video_viewed_at 
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  <Video className="w-4 h-4" />
                                  <span>Video ansehen</span>
                                  {caseStudy.video_viewed_at && <span className="text-xs">✓</span>}
                                </button>
                              )}
                              {caseStudy.written_correction_url && (
                                <a
                                  href={caseStudy.written_correction_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handlePdfDownload(caseStudy.id)}
                                  className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                                    caseStudy.pdf_downloaded_at 
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-gray-600 text-white hover:bg-gray-700'
                                  }`}
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>PDF herunterladen</span>
                                  {caseStudy.pdf_downloaded_at && <span className="text-xs">✓</span>}
                                </a>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            💡 Schaue Dir sowohl die Video-Korrektur, als auch die schriftliche Bewertung Deines Dozenten an, um einen maximalen Mehrwert in der Nachbereitung zu erhalten!
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Noch keine Korrekturen verfügbar.</p>
              <p className="text-sm text-gray-500">Ihre Korrekturen erscheinen hier, sobald sie von einem Dozenten hochgeladen wurden.</p>
            </div>
          )}
        </div>

        {/* Video Modal */}
        {videoModalOpen && currentVideoUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Video-Korrektur</h3>
                <button
                  onClick={closeVideoModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4">
                <div className="aspect-video w-full">
                  <iframe
                    src={currentVideoUrl}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allowFullScreen
                    title="Loom Video Correction"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
