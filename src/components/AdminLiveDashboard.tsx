import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Video, 
  User,
  Calendar,
  RefreshCw,
  Eye,
  TrendingUp,
  Users,
  FileText,
  Zap
} from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase-admin'

interface LiveCaseData {
  id: string
  user_id: string
  legal_area: string
  sub_area: string
  status: string
  created_at: string
  updated_at: string
  assigned_instructor_id?: string
  assignment_date?: string
  student?: {
    first_name: string
    last_name: string
    email: string
  }
  assigned_instructor?: {
    first_name: string
    last_name: string
    email: string
    role: string
  }
}

interface LiveStats {
  totalCases: number
  activeCases: number
  completedToday: number
  avgProcessingTime: string
  instructorsActive: number
  springersActive: number
}

const AdminLiveDashboard: React.FC = () => {
  const [cases, setCases] = useState<LiveCaseData[]>([])
  const [stats, setStats] = useState<LiveStats>({
    totalCases: 0,
    activeCases: 0,
    completedToday: 0,
    avgProcessingTime: '0h',
    instructorsActive: 0,
    springersActive: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const statusConfig = {
    requested: {
      label: 'Angefordert',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
      priority: 1,
      description: 'Klausur wurde angefordert'
    },
    submitted: {
      label: 'Eingereicht',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: FileText,
      priority: 2,
      description: 'Bereit zur Bearbeitung durch Dozent'
    },
    in_bearbeitung: {
      label: 'In Bearbeitung',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Zap,
      priority: 3,
      description: 'Wird aktuell bearbeitet'
    },
    corrected: {
      label: 'Korrigiert',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      priority: 4,
      description: 'Korrektur ist fertig'
    },
    completed: {
      label: 'Abgeschlossen',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: CheckCircle,
      priority: 5,
      description: 'Vollständig bearbeitet'
    },
    video_angefordert: {
      label: 'Video angefordert',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: Video,
      priority: 6,
      description: 'Video wurde angefordert'
    },
    video_hochgeladen: {
      label: 'Video hochgeladen',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: Video,
      priority: 7,
      description: 'Videokorrektur wurde hochgeladen'
    }
  }

  useEffect(() => {
    fetchLiveData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchLiveData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchLiveData = async () => {
    try {
      setLoading(true)
      
      // Fetch active cases (not completed)
      const { data: activeCases, error: casesError } = await supabaseAdmin
        .from('case_study_requests')
        .select(`
          *,
          student:user_id(first_name, last_name, email),
          assigned_instructor:assigned_instructor_id(first_name, last_name, email, role)
        `)
        .not('status', 'in', '(completed)')
        .order('updated_at', { ascending: false })

      if (casesError) throw casesError

      setCases(activeCases || [])

      // Calculate statistics
      await calculateStats(activeCases || [])
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching live data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = async (activeCases: LiveCaseData[]) => {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Count completed cases today
      const { data: completedToday, error: completedError } = await supabaseAdmin
        .from('case_study_requests')
        .select('id')
        .eq('status', 'completed')
        .gte('updated_at', today)

      if (completedError) throw completedError

      // Count active instructors and springer
      const { data: activeUsers, error: usersError } = await supabaseAdmin
        .from('users')
        .select('role, email_notifications_enabled')
        .in('role', ['instructor', 'springer'])
        .eq('email_notifications_enabled', true)

      if (usersError) throw usersError

      const instructorsActive = activeUsers?.filter((u: any) => u.role === 'instructor').length || 0
      const springersActive = activeUsers?.filter((u: any) => u.role === 'springer').length || 0

      // Calculate average processing time (simplified)
      const { data: recentCompleted, error: avgError } = await supabaseAdmin
        .from('case_study_requests')
        .select('created_at, updated_at')
        .eq('status', 'completed')
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50)

      let avgProcessingTime = '0h'
      if (recentCompleted && recentCompleted.length > 0) {
        const totalHours = recentCompleted.reduce((sum: number, case_: any) => {
          const created = new Date(case_.created_at)
          const completed = new Date(case_.updated_at)
          return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60)
        }, 0)
        const avgHours = Math.round(totalHours / recentCompleted.length)
        avgProcessingTime = `${avgHours}h`
      }

      // Get total cases count
      const { count: totalCount, error: countError } = await supabaseAdmin
        .from('case_study_requests')
        .select('*', { count: 'exact', head: true })

      if (countError) throw countError

      setStats({
        totalCases: totalCount || 0,
        activeCases: activeCases.length,
        completedToday: completedToday?.length || 0,
        avgProcessingTime,
        instructorsActive,
        springersActive
      })

    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const getStatusPriority = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.priority || 0
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`
    } else if (diffHours > 0) {
      return `vor ${diffHours} Std.`
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `vor ${diffMinutes} Min.`
    }
  }

  const getUrgencyColor = (createdAt: string, status: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const hoursOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60)

    if (status === 'submitted' && hoursOld > 24) {
      return 'border-l-4 border-red-500 bg-red-50'
    } else if (status === 'in_bearbeitung' && hoursOld > 48) {
      return 'border-l-4 border-orange-500 bg-orange-50'
    } else if (hoursOld > 72) {
      return 'border-l-4 border-yellow-500 bg-yellow-50'
    }
    return 'border-l-4 border-gray-200'
  }

  // Sort cases by priority and urgency
  const sortedCases = [...cases].sort((a, b) => {
    const priorityA = getStatusPriority(a.status)
    const priorityB = getStatusPriority(b.status)
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA // Higher priority first
    }
    
    // If same priority, sort by creation date (older first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Lade Live-Daten...</span>
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
            Live Dashboard
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
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </button>
            <button
              onClick={fetchLiveData}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              title="Manuell aktualisieren"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          Echtzeit-Übersicht aller aktiven Bearbeitungsprozesse
        </p>
      </div>

      {/* Live Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Gesamt</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCases}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Aktiv</p>
              <p className="text-2xl font-semibold text-orange-600">{stats.activeCases}</p>
            </div>
            <Zap className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Heute fertig</p>
              <p className="text-2xl font-semibold text-green-600">{stats.completedToday}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ø Bearbeitungszeit</p>
              <p className="text-2xl font-semibold text-purple-600">{stats.avgProcessingTime}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Dozenten aktiv</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.instructorsActive}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Springer aktiv</p>
              <p className="text-2xl font-semibold text-indigo-600">{stats.springersActive}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Active Cases Stream */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Aktive Bearbeitungen ({stats.activeCases})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Live-Stream aller laufenden Aufträge, sortiert nach Priorität und Dringlichkeit
          </p>
        </div>
        
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {sortedCases.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine aktiven Aufträge</h3>
              <p className="mt-1 text-sm text-gray-500">
                Alle Aufträge sind aktuell abgeschlossen.
              </p>
            </div>
          ) : (
            sortedCases.map((case_) => {
              const config = statusConfig[case_.status as keyof typeof statusConfig]
              const Icon = config?.icon || AlertCircle
              const urgencyClass = getUrgencyColor(case_.created_at, case_.status)
              
              return (
                <div key={case_.id} className={`p-4 hover:bg-gray-50 ${urgencyClass}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Status Icon */}
                      <div className={`flex-shrink-0 p-2 rounded-full ${config?.color.replace('text-', 'bg-').replace('border-', '').replace('bg-', 'bg-opacity-20 bg-')}`}>
                        <Icon className={`w-4 h-4 ${config?.color.split(' ')[1]}`} />
                      </div>
                      
                      {/* Case Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
                            {config?.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {case_.legal_area} • {case_.sub_area}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="font-medium">
                              {case_.student?.first_name} {case_.student?.last_name}
                            </span>
                          </div>
                          
                          {case_.assigned_instructor && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">→</span>
                              <span className={`font-medium ${case_.assigned_instructor.role === 'springer' ? 'text-indigo-600' : 'text-blue-600'}`}>
                                {case_.assigned_instructor.role === 'springer' ? '🔄' : '👨‍🏫'} {case_.assigned_instructor.first_name} {case_.assigned_instructor.last_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Timing */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatTimeAgo(case_.updated_at)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Erstellt: {formatTimeAgo(case_.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Description */}
                  <div className="mt-2 ml-12">
                    <p className="text-xs text-gray-600">
                      {config?.description}
                    </p>
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

export default AdminLiveDashboard
