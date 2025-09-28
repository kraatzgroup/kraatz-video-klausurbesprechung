import React, { useState, useEffect } from 'react'
import { Play, Clock, BookOpen, Upload, X, Edit, Trash2, Settings, CheckCircle, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserRole } from '../hooks/useUserRole'
import { supabase } from '../lib/supabase'

interface VideoLesson {
  id: string
  title: string
  description: string
  video_url: string
  youtube_id?: string
  duration: number
  is_active: boolean
  category: string
  thumbnail_url?: string
  created_at: string
  sort_order?: number
}

interface VideoProgress {
  id: string
  user_id: string
  video_lesson_id: string
  watched: boolean
  watch_time: number
  completed_at?: string
}

export const MasterclassPage: React.FC = () => {
  const { user } = useAuth()
  const { userProfile } = useUserRole()
  const [lessons, setLessons] = useState<VideoLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    duration: 0
  })
  const [editingLesson, setEditingLesson] = useState<VideoLesson | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null)
  const [showAdminView, setShowAdminView] = useState(false)
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([])
  // const [videoOrder, setVideoOrder] = useState<string[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)


  useEffect(() => {
    fetchLessons()
    if (user) {
      fetchVideoProgress()
    }
  }, [user])

  const fetchLessons = async () => {
    try {
      console.log('Fetching video lessons...')
      console.log('Current user:', user)
      console.log('User profile:', userProfile)
      
      // Try without RLS first to see if that's the issue
      const { data, error } = await supabase
        .from('video_lessons')
        .select('*')
        .eq('is_active', true)

      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Supabase error:', error)
        // If RLS is blocking, try to get user info
        console.log('Checking user session...')
        const { data: session } = await supabase.auth.getSession()
        console.log('Session:', session)
        throw error
      }
      
      const fetchedLessons = data || []
      console.log('Fetched lessons count:', fetchedLessons.length)
      console.log('Fetched lessons:', fetchedLessons)
      
      if (fetchedLessons.length === 0) {
        console.log('No videos found - this could be RLS blocking access')
        setLessons([])
        // setVideoOrder([])
        return
      }

      // Load saved order from localStorage
      const savedOrder = localStorage.getItem('video-order')
      if (savedOrder && userProfile?.role === 'admin') {
        try {
          const orderArray = JSON.parse(savedOrder)
          console.log('Found saved order:', orderArray)
          
          // Sort lessons according to saved order
          const sortedLessons = [...fetchedLessons].sort((a, b) => {
            const aIndex = orderArray.indexOf(a.id)
            const bIndex = orderArray.indexOf(b.id)
            
            // If both videos are in the order array, sort by their position
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex
            }
            // If only one is in the array, prioritize it
            if (aIndex !== -1) return -1
            if (bIndex !== -1) return 1
            // If neither is in the array, maintain original order
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          
          console.log('Applied saved order to lessons')
          setLessons(sortedLessons)
          // setVideoOrder(sortedLessons.map(lesson => lesson.id))
        } catch (e) {
          console.error('Error parsing saved video order:', e)
          // Fallback to creation date order
          const sortedByDate = [...fetchedLessons].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          setLessons(sortedByDate)
          // setVideoOrder(sortedByDate.map(lesson => lesson.id))
        }
      } else {
        // No saved order or not admin - use creation date order
        const sortedByDate = [...fetchedLessons].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setLessons(sortedByDate)
        // setVideoOrder(sortedByDate.map(lesson => lesson.id))
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
      // Set empty array to show the "no videos" message
      setLessons([])
      // setVideoOrder([])
    } finally {
      setLoading(false)
    }
  }

  const fetchVideoProgress = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setVideoProgress(data || [])
    } catch (error) {
      console.error('Error fetching video progress:', error)
    }
  }

  const markVideoAsWatched = async (videoId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('video_progress')
        .upsert({
          user_id: user.id,
          video_lesson_id: videoId,
          watched: true,
          watch_time: 0,
          completed_at: new Date().toISOString()
        })

      if (error) throw error
      fetchVideoProgress()
    } catch (error) {
      console.error('Error marking video as watched:', error)
    }
  }

  const isVideoWatched = (videoId: string): boolean => {
    return videoProgress.some(progress => 
      progress.video_lesson_id === videoId && progress.watched
    )
  }

  const moveVideo = (videoId: string, direction: 'up' | 'down') => {
    const currentIndex = lessons.findIndex(lesson => lesson.id === videoId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= lessons.length) return

    const updatedLessons = [...lessons]
    const [movedLesson] = updatedLessons.splice(currentIndex, 1)
    updatedLessons.splice(newIndex, 0, movedLesson)

    // Update lessons state and video order
    setLessons(updatedLessons)
    // setVideoOrder(updatedLessons.map(lesson => lesson.id))
    setHasUnsavedChanges(true)
  }

  const saveVideoOrder = async () => {
    if (!hasUnsavedChanges) return
    
    setIsSaving(true)
    try {
      console.log('Saving video order to localStorage...')
      console.log('Current lessons order:', lessons.map((l, i) => ({ id: l.id, title: l.title, position: i })))
      
      // Save order to localStorage as fallback since sort_order column doesn't exist
      const currentVideoOrder = lessons.map(lesson => lesson.id)
      localStorage.setItem('video-order', JSON.stringify(currentVideoOrder))
      console.log('Saved video order:', currentVideoOrder)
      
      // Also save with timestamps for better persistence
      const orderWithTimestamps = lessons.map((lesson, index) => ({
        id: lesson.id,
        position: index,
        timestamp: new Date().toISOString()
      }))
      localStorage.setItem('video-order-detailed', JSON.stringify(orderWithTimestamps))
      
      // Update the videoOrder state to match what we saved
      // setVideoOrder(currentVideoOrder)
      setHasUnsavedChanges(false)
      
      // Verify the save worked
      const savedOrder = localStorage.getItem('video-order')
      console.log('Verification - saved order in localStorage:', savedOrder)
      
      console.log('Video order saved to localStorage successfully')
      
      // Show success message
      alert('Video-Reihenfolge erfolgreich gespeichert!')
    } catch (error) {
      console.error('Error saving video order:', error)
      alert('Fehler beim Speichern der Video-Reihenfolge: ' + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, videoId: string) => {
    setDraggedItem(videoId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', videoId)
  }

  const handleDragOver = (e: React.DragEvent, videoId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItem(videoId)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, targetVideoId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetVideoId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const draggedIndex = lessons.findIndex(lesson => lesson.id === draggedItem)
    const targetIndex = lessons.findIndex(lesson => lesson.id === targetVideoId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const updatedLessons = [...lessons]
    const [movedLesson] = updatedLessons.splice(draggedIndex, 1)
    updatedLessons.splice(targetIndex, 0, movedLesson)

    setLessons(updatedLessons)
    // setVideoOrder(updatedLessons.map(lesson => lesson.id))
    setDraggedItem(null)
    setDragOverItem(null)
    setHasUnsavedChanges(true)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const filteredLessons = lessons

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
      /youtube\.com\/embed\/([\w-]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const handleYouTubeUrlChange = (url: string) => {
    setUploadData(prev => ({ ...prev, youtube_url: url }))
    
    // Auto-extract video ID and validate
    const videoId = extractYouTubeId(url)
    if (videoId) {
      // You could fetch video metadata from YouTube API here if needed
      console.log('Valid YouTube video ID:', videoId)
    }
  }

  const handleVideoSave = async () => {
    if (!uploadData.youtube_url || !uploadData.title || !uploadData.description) {
      alert('Bitte füllen Sie alle Pflichtfelder aus und geben Sie eine YouTube-URL ein.')
      return
    }

    const videoId = extractYouTubeId(uploadData.youtube_url)
    if (!videoId) {
      alert('Bitte geben Sie eine gültige YouTube-URL ein.')
      return
    }

    setUploading(true)
    
    try {
      // Generate YouTube embed URL and thumbnail
      const embedUrl = `https://www.youtube.com/embed/${videoId}`
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

      // Save lesson to database (without youtube_id for now)
      const { error: dbError } = await supabase
        .from('video_lessons')
        .insert({
          title: uploadData.title,
          description: uploadData.description,
          video_url: embedUrl,
          duration: uploadData.duration || 0,
          category: 'allgemein',
          thumbnail_url: thumbnailUrl,
          is_active: true
        })

      if (dbError) throw dbError

      alert('YouTube-Video erfolgreich hinzugefügt!')
      setShowUploadModal(false)
      setUploadData({ title: '', description: '', youtube_url: '', duration: 0 })
      fetchLessons()
    } catch (error) {
      console.error('Error saving video:', error)
      alert('Fehler beim Speichern des Videos: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const resetUploadForm = () => {
    setUploadData({ title: '', description: '', youtube_url: '', duration: 0 })
    setShowUploadModal(false)
    setEditingLesson(null)
  }

  const handleVideoClick = (lesson: VideoLesson) => {
    setSelectedVideo(lesson)
    setShowVideoModal(true)
    // Mark video as watched when opened
    markVideoAsWatched(lesson.id)
  }

  const closeVideoModal = () => {
    setShowVideoModal(false)
    setSelectedVideo(null)
  }

  const handleEditLesson = (lesson: VideoLesson) => {
    setEditingLesson(lesson)
    // Extract YouTube ID from existing video_url if it's a YouTube embed
    let youtubeUrl = ''
    if (lesson.video_url?.includes('youtube.com/embed/')) {
      const videoId = lesson.video_url.split('/embed/')[1]?.split('?')[0]
      if (videoId) {
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
      }
    }
    
    setUploadData({
      title: lesson.title,
      description: lesson.description,
      youtube_url: youtubeUrl,
      duration: lesson.duration
    })
    setShowUploadModal(true)
  }

  const handleUpdateLesson = async () => {
    if (!editingLesson || !uploadData.title || !uploadData.description || !uploadData.youtube_url) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    const videoId = extractYouTubeId(uploadData.youtube_url)
    if (!videoId) {
      alert('Bitte geben Sie eine gültige YouTube-URL ein.')
      return
    }

    setUploading(true)
    try {
      // Generate YouTube embed URL and thumbnail
      const embedUrl = `https://www.youtube.com/embed/${videoId}`
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

      // Update lesson in database
      const { error: dbError } = await supabase
        .from('video_lessons')
        .update({
          title: uploadData.title,
          description: uploadData.description,
          video_url: embedUrl,
          duration: uploadData.duration || editingLesson.duration,
          category: 'allgemein',
          thumbnail_url: thumbnailUrl
        })
        .eq('id', editingLesson.id)

      if (dbError) throw dbError

      alert('Video erfolgreich aktualisiert!')
      resetUploadForm()
      fetchLessons()
    } catch (error) {
      console.error('Error updating video:', error)
      alert('Fehler beim Aktualisieren des Videos: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Video-Lektion löschen möchten?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('video_lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error

      alert('Video-Lektion erfolgreich gelöscht!')
      fetchLessons()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Fehler beim Löschen der Video-Lektion: ' + (error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Klausuren-Masterclass</h1>
              <p className="text-gray-600">Lerne von Experten mit unseren Video-Lektionen</p>
            </div>
            {userProfile?.role === 'admin' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdminView(!showAdminView)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    showAdminView 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  {showAdminView ? 'Student-Ansicht' : 'Admin-Ansicht'}
                </button>
                {showAdminView && hasUnsavedChanges && (
                  <button
                    onClick={saveVideoOrder}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {isSaving ? 'Speichere...' : 'Änderungen speichern'}
                  </button>
                )}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Video hochladen
                </button>
              </div>
            )}
          </div>
        </div>


        {/* Video Lessons Grid */}
        {filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Noch keine Videos verfügbar
            </h3>
            <p className="text-gray-600">
              Es wurden noch keine Video-Lektionen hochgeladen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredLessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className={`space-y-2 sm:space-y-3 transition-all duration-200 ${
                  userProfile?.role === 'admin' && showAdminView ? 'cursor-move' : ''
                } ${
                  draggedItem === lesson.id ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverItem === lesson.id ? 'transform scale-105' : ''
                }`}
                draggable={userProfile?.role === 'admin' && showAdminView}
                onDragStart={(e) => handleDragStart(e, lesson.id)}
                onDragOver={(e) => handleDragOver(e, lesson.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, lesson.id)}
                onDragEnd={handleDragEnd}
              >
                {/* Watch Status Indicator Above Video */}
                <div className="flex items-center gap-2">
                  {isVideoWatched(lesson.id) && (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Gesehen
                    </span>
                  )}
                </div>
                
                {/* Video Card */}
                <div className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col ${
                  dragOverItem === lesson.id ? 'ring-2 ring-blue-400 shadow-lg' : ''
                }`}>
                {/* Video Thumbnail with Play Button */}
                <div 
                  className="relative aspect-video bg-gray-200 cursor-pointer group"
                  onClick={() => handleVideoClick(lesson)}
                >
                  {lesson.thumbnail_url ? (
                    <img
                      src={lesson.thumbnail_url}
                      alt={lesson.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="rounded-full p-4 opacity-80 group-hover:opacity-100 transition-opacity" style={{backgroundColor: '#2e83c2'}}>
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                  {lesson.duration > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(lesson.duration)}
                    </div>
                  )}
                  {/* Admin Controls */}
                  {userProfile?.role === 'admin' && showAdminView && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {/* Drag Handle */}
                      <div 
                        className="bg-gray-600 hover:bg-gray-700 text-white p-1.5 rounded transition-colors cursor-move"
                        title="Zum Verschieben ziehen"
                      >
                        <GripVertical className="w-3 h-3" />
                      </div>
                      {/* Move Up Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveVideo(lesson.id, 'up')
                        }}
                        disabled={lessons.findIndex(l => l.id === lesson.id) === 0}
                        className="bg-gray-600 hover:bg-gray-700 text-white p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Nach oben verschieben"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      {/* Move Down Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveVideo(lesson.id, 'down')
                        }}
                        disabled={lessons.findIndex(l => l.id === lesson.id) === lessons.length - 1}
                        className="bg-gray-600 hover:bg-gray-700 text-white p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Nach unten verschieben"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditLesson(lesson)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition-colors"
                        title="Video bearbeiten"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteLesson(lesson.id)
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition-colors"
                        title="Video löschen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {lesson.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                    {lesson.description}
                  </p>
                  
                  {/* Fullscreen Button */}
                  <div className="flex justify-end mt-auto">
                    <button 
                      onClick={() => handleVideoClick(lesson)}
                      className="flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                      style={{backgroundColor: '#2e83c2'}}
                    >
                      <Play className="w-4 h-4" />
                      In Vollbild ansehen
                    </button>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal (for admins) */}
        {showUploadModal && userProfile?.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Upload className="w-6 h-6 text-primary" />
                    {editingLesson ? 'Video bearbeiten' : 'YouTube-Video hinzufügen'}
                  </h2>
                  <button
                    onClick={resetUploadForm}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* YouTube URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube-URL *
                    </label>
                    <input
                      type="url"
                      value={uploadData.youtube_url}
                      onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="https://www.youtube.com/watch?v=... oder https://youtu.be/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Unterstützte Formate: YouTube Watch-URLs, Short-URLs und Embed-URLs
                    </p>
                    {uploadData.youtube_url && extractYouTubeId(uploadData.youtube_url) && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                          ✓ Gültige YouTube-URL erkannt
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titel *
                    </label>
                    <input
                      type="text"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="z.B. Grundlagen des Zivilrechts"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschreibung *
                    </label>
                    <textarea
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Kurze Beschreibung des Video-Inhalts..."
                    />
                  </div>

                  {/* Duration Input (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Videodauer (optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={uploadData.duration}
                      onChange={(e) => setUploadData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Dauer in Sekunden (z.B. 1800 für 30 Min)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lassen Sie das Feld leer, wenn die Dauer automatisch erkannt werden soll
                    </p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={resetUploadForm}
                    disabled={uploading}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={editingLesson ? handleUpdateLesson : handleVideoSave}
                    disabled={uploading || !uploadData.youtube_url || !uploadData.title || !uploadData.description}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Wird gespeichert...' : editingLesson ? 'Video aktualisieren' : 'Video hinzufügen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Lightbox Modal */}
        {showVideoModal && selectedVideo && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-6"
            onClick={closeVideoModal}
          >
            <div 
              className="relative w-full max-w-3xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button - Always Visible */}
              <button
                onClick={closeVideoModal}
                className="absolute -top-14 right-0 text-white hover:text-red-400 transition-colors z-[60] bg-black bg-opacity-70 rounded-full p-3 shadow-lg"
                style={{ position: 'fixed', top: '20px', right: '20px' }}
              >
                <X className="w-8 h-8" />
              </button>
              
              {/* Video Title */}
              <div className="text-white text-center mb-6">
                <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
                <p className="text-gray-300 mt-2 text-sm">{selectedVideo.description}</p>
              </div>

              {/* YouTube Video Player */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                {selectedVideo.video_url?.includes('youtube.com/embed/') ? (
                  <iframe
                    src={`${selectedVideo.video_url}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=1`}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <p>Video nicht verfügbar</p>
                  </div>
                )}
              </div>

              {/* Video Info */}
              {selectedVideo.duration > 0 && (
                <div className="text-center mt-4 text-gray-300">
                  <span className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Dauer: {formatDuration(selectedVideo.duration)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
