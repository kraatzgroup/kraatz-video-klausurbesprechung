import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  FileText, 
  Video, 
  User,
  Calendar,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  Upload,
  Download,
  MessageCircle,
  Award
} from 'lucide-react'

// Create admin client
const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co',
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'
)

interface ActivityItem {
  id: string
  timestamp: string
  instructor_name: string
  instructor_role: string
  student_name: string
  action: string
  description: string
  legal_area: string
  sub_area: string
  status_from?: string
  status_to?: string
  case_id: string
  icon: any
  color: string
}

interface ActivityStats {
  totalActivities: number
  todayActivities: number
  activeInstructors: number
  completedToday: number
  avgResponseTime: string
}

const AdminActivityDashboard: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [stats, setStats] = useState<ActivityStats>({
    totalActivities: 0,
    todayActivities: 0,
    activeInstructors: 0,
    completedToday: 0,
    avgResponseTime: '0h'
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    fetchActivityData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchActivityData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedTimeframe])

  const fetchActivityData = async () => {
    try {
      setLoading(true)
      
      // Calculate timeframe
      const now = new Date()
      let startDate: Date
      
      switch (selectedTimeframe) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }

      // Fetch case activities with instructor and student info
      const { data: cases, error: casesError } = await supabaseAdmin
        .from('case_study_requests')
        .select(`
          id,
          created_at,
          updated_at,
          status,
          legal_area,
          sub_area,
          assignment_date,
          assignment_reason,
          student:user_id(first_name, last_name, email),
          assigned_instructor:assigned_instructor_id(first_name, last_name, email, role)
        `)
        .gte('updated_at', startDate.toISOString())
        .order('updated_at', { ascending: false })

      if (casesError) throw casesError

      // Generate activity items from case data
      const activityItems: ActivityItem[] = []

      cases?.forEach(case_ => {
        const instructor = case_.assigned_instructor
        const student = case_.student

        if (!instructor || !student) return

        // Generate activities based on status and timestamps
        const activities = generateActivitiesFromCase(case_, instructor, student)
        activityItems.push(...activities)
      })

      // Sort by timestamp (newest first)
      activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(activityItems)
      await calculateStats(activityItems, startDate)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error('Error fetching activity data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateActivitiesFromCase = (case_: any, instructor: any, student: any): ActivityItem[] => {
    const activities: ActivityItem[] = []
    const baseActivity = {
      case_id: case_.id,
      instructor_name: `${instructor.first_name} ${instructor.last_name}`,
      instructor_role: instructor.role,
      student_name: `${student.first_name} ${student.last_name}`,
      legal_area: case_.legal_area,
      sub_area: case_.sub_area
    }

    // Generate activities based on workflow progression
    const createdDate = new Date(case_.created_at)
    const updatedDate = new Date(case_.updated_at)
    
    // 1. Student hat Sachverhalt angefordert (always first step)
    activities.push({
      ...baseActivity,
      id: `${case_.id}_requested`,
      timestamp: case_.created_at,
      action: 'Sachverhalt angefordert',
      description: `Student hat Sachverhalt für ${case_.sub_area} angefordert`,
      icon: MessageCircle,
      color: 'text-yellow-600 bg-yellow-100'
    })

    // 2. Dozent hat Sachverhalt zur Verfügung gestellt (if status progressed beyond requested)
    if (case_.status !== 'requested') {
      const sachverhaltDate = new Date(createdDate.getTime() + 2 * 60 * 60 * 1000) // +2 hours
      activities.push({
        ...baseActivity,
        id: `${case_.id}_sachverhalt_provided`,
        timestamp: sachverhaltDate.toISOString(),
        action: 'Sachverhalt bereitgestellt',
        description: `${instructor.first_name} ${instructor.last_name} hat Sachverhalt zur Verfügung gestellt`,
        icon: Download,
        color: 'text-blue-600 bg-blue-100'
      })
    }

    // 3. Student hat Bearbeitung eingereicht (if status is submitted or beyond)
    if (['submitted', 'in_bearbeitung', 'corrected', 'video_angefordert', 'video_hochgeladen', 'completed'].includes(case_.status)) {
      activities.push({
        ...baseActivity,
        id: `${case_.id}_submitted`,
        timestamp: case_.status === 'submitted' ? case_.updated_at : case_.created_at,
        action: 'Bearbeitung eingereicht',
        description: `Student hat Bearbeitung eingereicht - bereit zur Korrektur`,
        icon: Upload,
        color: 'text-indigo-600 bg-indigo-100'
      })

      // 3b. Automatic notification to instructor
      const notificationDate = new Date(case_.status === 'submitted' ? case_.updated_at : case_.created_at)
      notificationDate.setMinutes(notificationDate.getMinutes() + 2) // +2 minutes after submission
      
      activities.push({
        ...baseActivity,
        id: `${case_.id}_instructor_notified`,
        timestamp: notificationDate.toISOString(),
        action: 'Dozent benachrichtigt',
        description: `${instructor.first_name} ${instructor.last_name} wurde über neue Bearbeitung informiert`,
        icon: MessageCircle,
        color: 'text-blue-600 bg-blue-100'
      })
    }

    // 4. Dozent hat Korrektur begonnen (if status is in_bearbeitung or beyond)
    if (['in_bearbeitung', 'corrected', 'video_angefordert', 'video_hochgeladen', 'completed'].includes(case_.status)) {
      const korrekturStartDate = case_.status === 'in_bearbeitung' ? case_.updated_at : 
        new Date(updatedDate.getTime() - 24 * 60 * 60 * 1000).toISOString() // -1 day
      activities.push({
        ...baseActivity,
        id: `${case_.id}_correction_started`,
        timestamp: korrekturStartDate,
        action: 'Korrektur begonnen',
        description: `${instructor.first_name} ${instructor.last_name} hat mit der Korrektur begonnen`,
        icon: Zap,
        color: 'text-purple-600 bg-purple-100'
      })
    }

    // 5. Dozent hat Korrektur hochgeladen (if status is corrected or beyond)
    if (['corrected', 'video_angefordert', 'video_hochgeladen', 'completed'].includes(case_.status)) {
      activities.push({
        ...baseActivity,
        id: `${case_.id}_correction_uploaded`,
        timestamp: case_.status === 'corrected' ? case_.updated_at : case_.updated_at,
        action: 'Korrektur hochgeladen',
        description: `${instructor.first_name} ${instructor.last_name} hat Korrektur und Bewertung hochgeladen`,
        icon: CheckCircle,
        color: 'text-green-600 bg-green-100'
      })
    }

    // 6. Student hat Video angefordert (if status is video_angefordert or beyond)
    if (['video_angefordert', 'video_hochgeladen', 'completed'].includes(case_.status)) {
      activities.push({
        ...baseActivity,
        id: `${case_.id}_video_requested`,
        timestamp: case_.status === 'video_angefordert' ? case_.updated_at : case_.updated_at,
        action: 'Video angefordert',
        description: `Student hat Videokorrektur angefordert`,
        icon: Video,
        color: 'text-orange-600 bg-orange-100'
      })
    }

    // 7. Dozent hat Video hochgeladen (if status is video_hochgeladen or completed)
    if (['video_hochgeladen', 'completed'].includes(case_.status)) {
      activities.push({
        ...baseActivity,
        id: `${case_.id}_video_uploaded`,
        timestamp: case_.status === 'video_hochgeladen' ? case_.updated_at : case_.updated_at,
        action: 'Video hochgeladen',
        description: `${instructor.first_name} ${instructor.last_name} hat Videokorrektur hochgeladen`,
        icon: Video,
        color: 'text-indigo-600 bg-indigo-100'
      })
    }

    // 8. Fall abgeschlossen (if status is completed)
    if (case_.status === 'completed') {
      activities.push({
        ...baseActivity,
        id: `${case_.id}_completed`,
        timestamp: case_.updated_at,
        action: 'Fall abgeschlossen',
        description: `Bearbeitung vollständig abgeschlossen`,
        icon: Award,
        color: 'text-gray-600 bg-gray-100'
      })
    }

    // Assignment activity (if exists)
    if (case_.assignment_date) {
      activities.push({
        ...baseActivity,
        id: `${case_.id}_assignment`,
        timestamp: case_.assignment_date,
        action: 'Auftrag zugewiesen',
        description: case_.assignment_reason === 'Historical assignment based on legal area' 
          ? 'Automatische Zuweisung basierend auf Rechtsgebiet'
          : (case_.assignment_reason || 'Auftrag wurde zugewiesen'),
        icon: User,
        color: 'text-blue-600 bg-blue-100'
      })
    }

    return activities
  }

  const calculateStats = async (activities: ActivityItem[], startDate: Date) => {
    try {
      // Count today's activities
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayActivities = activities.filter(a => 
        new Date(a.timestamp) >= todayStart
      ).length

      // Count active instructors
      const activeInstructors = new Set(
        activities.map(a => a.instructor_name)
      ).size

      // Count completed today
      const completedToday = activities.filter(a => 
        a.action === 'Fall abgeschlossen' && new Date(a.timestamp) >= todayStart
      ).length

      // Calculate average response time (simplified)
      const avgResponseTime = '2.5h' // Placeholder - would need more complex calculation

      setStats({
        totalActivities: activities.length,
        todayActivities,
        activeInstructors,
        completedToday,
        avgResponseTime
      })

    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`
    } else if (diffHours > 0) {
      return `vor ${diffHours} Std.`
    } else if (diffMinutes > 0) {
      return `vor ${diffMinutes} Min.`
    } else {
      return 'gerade eben'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Lade Aktivitätsdaten...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-600" />
            Live Dashboard - Aktivitätsprotokoll
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              Letztes Update: {lastUpdate.toLocaleTimeString('de-DE')}
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                autoRefresh 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={fetchActivityData}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              title="Manuell aktualisieren"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          Chronologische Übersicht aller Dozenten-Aktivitäten und Bearbeitungsschritte
        </p>
      </div>

      {/* Timeframe Selection */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Zeitraum:</span>
          <div className="flex gap-2">
            {[
              { key: 'today', label: 'Heute' },
              { key: 'week', label: 'Diese Woche' },
              { key: 'month', label: 'Dieser Monat' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedTimeframe(key as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedTimeframe === key
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Aktivitäten</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalActivities}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Heute</p>
              <p className="text-2xl font-semibold text-green-600">{stats.todayActivities}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Aktive Dozenten</p>
              <p className="text-2xl font-semibold text-purple-600">{stats.activeInstructors}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Heute fertig</p>
              <p className="text-2xl font-semibold text-orange-600">{stats.completedToday}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ø Reaktionszeit</p>
              <p className="text-2xl font-semibold text-indigo-600">{stats.avgResponseTime}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Aktivitätsprotokoll ({activities.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Chronologische Historie aller Dozenten-Aktivitäten
          </p>
        </div>
        
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Aktivitäten</h3>
              <p className="mt-1 text-sm text-gray-500">
                Für den gewählten Zeitraum wurden keine Aktivitäten gefunden.
              </p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = activity.icon
              
              return (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-full ${activity.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {activity.action}
                          </span>
                          <span className="text-xs text-gray-500">
                            {activity.legal_area} • {activity.sub_area}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatTimeAgo(activity.timestamp)}</span>
                          <span>•</span>
                          <span>{formatDateTime(activity.timestamp)}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${
                            activity.instructor_role === 'springer' ? 'text-indigo-600' : 'text-blue-600'
                          }`}>
                            {activity.instructor_role === 'springer' ? '🔄' : '👨‍🏫'} {activity.instructor_name}
                          </span>
                        </div>
                        <span>→</span>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{activity.student_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminActivityDashboard
