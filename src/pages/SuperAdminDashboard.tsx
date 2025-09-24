import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Settings, Shield, Activity, BarChart3, UserCheck, AlertTriangle, TrendingUp, Clock, CheckCircle, XCircle, Eye, Plus, Search, Filter, Download, Upload, RefreshCw, Trash2, Crown, Video, GraduationCap, UserPlus, Play } from 'lucide-react'
import { Link } from 'react-router-dom'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  account_credits: number
  created_at: string
  totalRequests?: number
  completedCases?: number
  pendingCases?: number
}

interface VideoLesson {
  id: string
  title: string
  description: string
  video_url: string
  duration: number
  category: string
  created_at: string
  thumbnail_url?: string
  is_active: boolean
}

const SuperAdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'instructors' | 'create-user' | 'videos'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'instructor' | 'admin'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [grantAmount, setGrantAmount] = useState('')
  const [newUser, setNewUser] = useState({
    email: '', first_name: '', last_name: '', role: 'student', password: ''
  })
  const [videos, setVideos] = useState<VideoLesson[]>([])
  const [videoSearchTerm, setVideoSearchTerm] = useState('')
  const [videoCategoryFilter, setVideoCategoryFilter] = useState<string>('all')

  useEffect(() => {
    fetchUsersWithStats()
    fetchVideos()
  }, [])

  const fetchUsersWithStats = async () => {
    try {
      setLoading(true)
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const usersWithStats = await Promise.all(
        usersData.map(async (user: any) => {
          const { data: requests } = await supabase
            .from('case_study_requests')
            .select('*')
            .eq('user_id', user.id)

          const { data: submissions } = await supabase
            .from('submissions')
            .select('*, case_study_requests!inner(user_id)')
            .eq('case_study_requests.user_id', user.id)

          return {
            ...user,
            totalRequests: requests?.length || 0,
            completedCases: submissions?.filter((s: any) => s.status === 'corrected').length || 0,
            pendingCases: requests?.filter((r: any) => r.status !== 'corrected').length || 0
          }
        })
      )

      setUsers(usersWithStats)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('video_lessons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data || [])
    } catch (error) {
      console.error('Error fetching videos:', error)
    }
  }

  const createUser = async () => {
    if (!newUser.email || !newUser.first_name || !newUser.last_name || !newUser.password) {
      alert('Bitte füllen Sie alle Felder aus.')
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      })

      if (authError) throw authError

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role,
          account_credits: newUser.role === 'student' ? 0 : 1000
        })

      if (profileError) throw profileError

      alert(`${newUser.role === 'instructor' ? 'Dozent' : newUser.role === 'admin' ? 'Administrator' : 'Student'} erfolgreich erstellt!`)
      setNewUser({ email: '', first_name: '', last_name: '', role: 'student', password: '' })
      fetchUsersWithStats()
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Fehler beim Erstellen des Benutzers')
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      alert('Benutzerrolle erfolgreich aktualisiert!')
      fetchUsersWithStats()
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Fehler beim Aktualisieren der Rolle')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) return

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error
      alert('Benutzer erfolgreich gelöscht!')
      fetchUsersWithStats()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Fehler beim Löschen des Benutzers')
    }
  }

  const grantCaseStudies = async () => {
    if (!selectedUser || !grantAmount) return

    try {
      const amount = parseInt(grantAmount)
      const { error } = await supabase
        .from('users')
        .update({ account_credits: (selectedUser.account_credits || 0) + amount })
        .eq('id', selectedUser.id)

      if (error) throw error
      alert(`${amount} Klausuren erfolgreich gewährt!`)
      setGrantModalOpen(false)
      setGrantAmount('')
      setSelectedUser(null)
      fetchUsersWithStats()
    } catch (error) {
      console.error('Error granting case studies:', error)
      alert('Fehler beim Gewähren der Klausuren')
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Video-Lektion löschen möchten?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('video_lessons')
        .delete()
        .eq('id', videoId)

      if (error) throw error

      alert('Video-Lektion erfolgreich gelöscht!')
      fetchVideos()
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Fehler beim Löschen der Video-Lektion')
    }
  }

  const toggleVideoStatus = async (videoId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('video_lessons')
        .update({ is_active: !currentStatus })
        .eq('id', videoId)

      if (error) throw error

      alert(`Video ${!currentStatus ? 'aktiviert' : 'deaktiviert'}!`)
      fetchVideos()
    } catch (error) {
      console.error('Error updating video status:', error)
      alert('Fehler beim Aktualisieren des Video-Status')
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const filteredVideos = videos.filter(video => {
    const matchesSearch = videoSearchTerm === '' ||
      video.title.toLowerCase().includes(videoSearchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(videoSearchTerm.toLowerCase())
    
    const matchesCategory = videoCategoryFilter === 'all' || video.category === videoCategoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Lade Super Admin Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Distinct Admin Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-yellow-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-xl shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
                <p className="text-yellow-300 text-sm">System Verwaltung & Benutzer Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 font-medium transition-colors"
              >
                <Users className="w-4 h-4" />
                Benutzerverwaltung
              </Link>
              <div className="text-right">
                <div className="text-sm text-yellow-300 font-medium">System Status</div>
                <div className="text-xs text-purple-300">Alle Systeme aktiv</div>
              </div>
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation with distinct admin styling */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'System Übersicht', icon: BarChart3 },
              { id: 'users', label: 'Alle Benutzer', icon: Users },
              { id: 'videos', label: 'Video Management', icon: Video },
              { id: 'instructors', label: 'Dozenten Management', icon: GraduationCap },
              { id: 'create-user', label: 'Benutzer Erstellen', icon: UserPlus }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                    : 'border-transparent text-purple-200 hover:text-white hover:border-purple-300 hover:bg-purple-500/10'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Cards with distinct admin styling */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm font-medium">Gesamt Benutzer</p>
                    <p className="text-4xl font-bold text-white">{users.length}</p>
                  </div>
                  <Users className="w-10 h-10 text-purple-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Studenten</p>
                    <p className="text-4xl font-bold text-white">{users.filter(u => u.role === 'student').length}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 hover:border-green-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm font-medium">Dozenten</p>
                    <p className="text-4xl font-bold text-white">{users.filter(u => u.role === 'instructor').length}</p>
                  </div>
                  <GraduationCap className="w-10 h-10 text-green-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-200 text-sm font-medium">Administratoren</p>
                    <p className="text-4xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
                  </div>
                  <Crown className="w-10 h-10 text-yellow-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-6 hover:border-indigo-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-200 text-sm font-medium">Video-Lektionen</p>
                    <p className="text-4xl font-bold text-white">{videos.length}</p>
                  </div>
                  <Video className="w-10 h-10 text-indigo-400" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-black/30 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Settings className="w-6 h-6 text-yellow-400" />
                Admin Schnellaktionen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('create-user')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="w-5 h-5" />
                  Neuen Benutzer erstellen
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <Video className="w-5 h-5" />
                  Videos verwalten
                </button>
                <button
                  onClick={() => setActiveTab('instructors')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <GraduationCap className="w-5 h-5" />
                  Dozenten verwalten
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <Users className="w-5 h-5" />
                  Alle Benutzer verwalten
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Activity className="w-6 h-6 text-purple-400" />
                Letzte Benutzer-Aktivitäten
              </h2>
              <div className="space-y-4">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-3 px-4 bg-black/20 rounded-lg border border-purple-500/20">
                    <div className="flex items-center space-x-3">
                      {user.role === 'admin' && <Crown className="w-5 h-5 text-yellow-500" />}
                      {user.role === 'instructor' && <GraduationCap className="w-5 h-5 text-green-500" />}
                      {user.role === 'student' && <Users className="w-5 h-5 text-blue-500" />}
                      <div>
                        <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-purple-300 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        {user.role === 'admin' && (
                          <span className="px-2 py-1 text-xs font-semibold bg-yellow-900/50 text-yellow-300 rounded-full border border-yellow-500/50">Super Admin</span>
                        )}
                        {user.role === 'instructor' && (
                          <span className="px-2 py-1 text-xs font-semibold bg-green-900/50 text-green-300 rounded-full border border-green-500/50">Dozent</span>
                        )}
                        {user.role === 'student' && (
                          <span className="px-2 py-1 text-xs font-semibold bg-blue-900/50 text-blue-300 rounded-full border border-blue-500/50">Student</span>
                        )}
                      </div>
                      <p className="text-purple-300 text-xs">
                        {new Date(user.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Benutzer suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-purple-500/50 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="px-4 py-3 bg-black/40 border border-purple-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="all">Alle Rollen</option>
                  <option value="admin">Administratoren</option>
                  <option value="instructor">Dozenten</option>
                  <option value="student">Studenten</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/40">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Benutzer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Rolle</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Klausuren</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Aktivität</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Registriert</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/20">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-black/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {user.role === 'admin' && <Crown className="w-5 h-5 text-yellow-500" />}
                            {user.role === 'instructor' && <GraduationCap className="w-5 h-5 text-green-500" />}
                            {user.role === 'student' && <Users className="w-5 h-5 text-blue-500" />}
                            <div>
                              <div className="text-sm font-medium text-white">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-purple-300">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === 'admin' && (
                            <span className="px-2 py-1 text-xs font-semibold bg-yellow-900/50 text-yellow-300 rounded-full border border-yellow-500/50">Super Admin</span>
                          )}
                          {user.role === 'instructor' && (
                            <span className="px-2 py-1 text-xs font-semibold bg-green-900/50 text-green-300 rounded-full border border-green-500/50">Dozent</span>
                          )}
                          {user.role === 'student' && (
                            <span className="px-2 py-1 text-xs font-semibold bg-blue-900/50 text-blue-300 rounded-full border border-blue-500/50">Student</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            Credits: {user.account_credits || 0}
                          </div>
                          <div className="text-xs text-purple-300">
                            Anfragen: {user.totalRequests || 0} | Abgeschlossen: {user.completedCases || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {(user.pendingCases || 0) > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-500/50">
                                {user.pendingCases} ausstehend
                              </span>
                            )}
                            {(user.completedCases || 0) > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-500/50">
                                {user.completedCases} abgeschlossen
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-300">
                          {new Date(user.created_at).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center space-x-2">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className="text-xs bg-black/40 border border-purple-500/50 rounded text-white px-2 py-1"
                            >
                              <option value="student">Student</option>
                              <option value="instructor">Dozent</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setGrantModalOpen(true)
                              }}
                              className="text-green-400 hover:text-green-300 transition-colors p-1"
                              title="Klausuren gewähren"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
                                title="Benutzer löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create User Tab */}
        {activeTab === 'create-user' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-black/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-blue-400" />
                Neuen Benutzer erstellen
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Vorname</label>
                    <input
                      type="text"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-blue-500/50 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Vorname eingeben"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Nachname</label>
                    <input
                      type="text"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-blue-500/50 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Nachname eingeben"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">E-Mail</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black/40 border border-blue-500/50 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="E-Mail eingeben"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Passwort</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-3 bg-black/40 border border-blue-500/50 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Starkes Passwort eingeben"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Benutzerrolle</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-4 py-3 bg-black/40 border border-blue-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Dozent</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setNewUser({ email: '', first_name: '', last_name: '', role: 'student', password: '' })}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Zurücksetzen
                  </button>
                  <button
                    onClick={createUser}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Benutzer erstellen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Management Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <Video className="w-6 h-6 text-purple-400" />
                  Video-Lektionen Management
                </h2>
                <div className="flex gap-4 ml-auto">
                  <Link
                    to="/masterclass"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Zur Masterclass
                  </Link>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Videos suchen..."
                    value={videoSearchTerm}
                    onChange={(e) => setVideoSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-purple-500/50 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
                <select
                  value={videoCategoryFilter}
                  onChange={(e) => setVideoCategoryFilter(e.target.value)}
                  className="px-4 py-3 bg-black/40 border border-purple-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="all">Alle Kategorien</option>
                  <option value="zivilrecht">Zivilrecht</option>
                  <option value="strafrecht">Strafrecht</option>
                  <option value="oeffentliches-recht">Öffentliches Recht</option>
                  <option value="klausurtechnik">Klausurtechnik</option>
                  <option value="gutachtenstil">Gutachtenstil</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/40">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Video</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Kategorie</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Dauer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Erstellt</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300 uppercase tracking-wider">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/20">
                    {filteredVideos.map((video) => (
                      <tr key={video.id} className="hover:bg-black/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-16 h-12 bg-gray-700 rounded overflow-hidden">
                              {video.thumbnail_url ? (
                                <img
                                  src={video.thumbnail_url}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white line-clamp-1">
                                {video.title}
                              </div>
                              <div className="text-sm text-purple-300 line-clamp-2">
                                {video.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold bg-blue-900/50 text-blue-300 rounded-full border border-blue-500/50">
                            {video.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(video.duration)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                            video.is_active
                              ? 'bg-green-900/50 text-green-300 border-green-500/50'
                              : 'bg-red-900/50 text-red-300 border-red-500/50'
                          }`}>
                            {video.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-300">
                          {new Date(video.created_at).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleVideoStatus(video.id, video.is_active)}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                video.is_active
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                              title={video.is_active ? 'Deaktivieren' : 'Aktivieren'}
                            >
                              {video.is_active ? 'Deaktivieren' : 'Aktivieren'}
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                              title="Video löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredVideos.length === 0 && (
                <div className="text-center py-8">
                  <Video className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Keine Videos gefunden
                  </h3>
                  <p className="text-purple-300 mb-4">
                    {videoSearchTerm || videoCategoryFilter !== 'all' 
                      ? 'Keine Videos entsprechen den Suchkriterien.'
                      : 'Noch keine Video-Lektionen hochgeladen.'}
                  </p>
                  <Link
                    to="/masterclass"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Erstes Video hochladen
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder for instructors tab */}
        {activeTab === 'instructors' && (
          <div className="bg-black/30 backdrop-blur-sm border border-green-500/30 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 justify-center">
              <GraduationCap className="w-6 h-6 text-green-400" />
              Dozenten Management
            </h2>
            <p className="text-green-300">Wird im nächsten Schritt implementiert...</p>
          </div>
        )}
      </div>

      {/* Grant Case Studies Modal */}
      {grantModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-purple-500/50 rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Plus className="w-5 h-5 text-green-400" />
              Klausuren gewähren
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-purple-200 mb-2">
                  Benutzer: <span className="font-semibold text-white">{selectedUser.first_name} {selectedUser.last_name}</span>
                </p>
                <p className="text-purple-200 mb-4">
                  Aktuelle Credits: <span className="font-semibold text-yellow-300">{selectedUser.account_credits || 0}</span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Anzahl Klausuren gewähren
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-purple-500/50 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Anzahl eingeben"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setGrantModalOpen(false)
                  setSelectedUser(null)
                  setGrantAmount('')
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={grantCaseStudies}
                disabled={!grantAmount || parseInt(grantAmount) <= 0}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Gewähren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperAdminDashboard
