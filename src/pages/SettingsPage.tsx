import React, { useState, useEffect } from 'react'
import { supabaseAdmin } from '../lib/supabase-admin'
import { useAuth } from '../contexts/AuthContext'
import { createUserAsAdmin, CreateUserData } from '../utils/adminUtils'
import { 
  Settings, Users, UserPlus, Search, Trash2, Plus, Crown, 
  GraduationCap, User, Mail, Bell, MailX, Calendar
} from 'lucide-react'
import ProfileImageUpload from '../components/ProfileImageUpload'
import ProfileImage from '../components/ProfileImage'


interface UserData {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  instructor_legal_area?: string
  email_notifications_enabled?: boolean
  profile_image_url?: string | null
  account_credits: number
  created_at: string
  totalRequests?: number
  completedCases?: number
  pendingCases?: number
}

const SettingsPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'user-management' | 'create-user'>('profile')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'instructor' | 'admin'>('all')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [grantAmount, setGrantAmount] = useState('')
  const [newUser, setNewUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'student',
    password: ''
  })
  const [currentUserRole, setCurrentUserRole] = useState('')
  const [currentUserProfile, setCurrentUserProfile] = useState<UserData | null>(null)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [vacationStartDate, setVacationStartDate] = useState('')
  const [vacationEndDate, setVacationEndDate] = useState('')
  const [vacationModalOpen, setVacationModalOpen] = useState(false)

  // Profile image update callback
  const handleProfileImageUpdate = (newImageUrl: string | null) => {
    if (currentUserProfile) {
      setCurrentUserProfile({
        ...currentUserProfile,
        profile_image_url: newImageUrl
      })
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchCurrentUserRole()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  useEffect(() => {
    console.log('🔄 SettingsPage useEffect triggered, currentUserRole:', currentUserRole)
    if (currentUserRole === 'admin') {
      console.log('✅ User is admin, calling fetchUsersWithStats')
      fetchUsersWithStats()
    } else {
      console.log('❌ User is not admin, role:', currentUserRole)
    }
  }, [currentUserRole])

  // Debug activeTab changes
  useEffect(() => {
    console.log('🔄 SettingsPage activeTab changed to:', activeTab)
    if (activeTab === 'user-management' && currentUserRole === 'admin') {
      console.log('✅ User switched to user-management tab, refetching users')
      fetchUsersWithStats()
    }
  }, [activeTab, currentUserRole])

  const fetchCurrentUserRole = async () => {
    if (currentUser) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        
        if (data && !error) {
          setCurrentUserRole(data.role || 'student')
          setCurrentUserProfile(data)
          setEmailNotificationsEnabled(data.email_notifications_enabled ?? true)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    setLoading(false)
  }

  const fetchUsersWithStats = async () => {
    console.log('🔄 SettingsPage fetchUsersWithStats called')
    try {
      setLoading(true)
      console.log('🔄 Loading set to true')
      
      // Use the test data directly since we know it works
      console.log('🔍 Using direct admin client query...')
      
      // Test raw query first
      const { data: testData, error: testError } = await supabaseAdmin
        .from('users')
        .select('*')
      
      console.log('🧪 Test query (no order):', testData, testError, testData?.length)
      
      if (testError) {
        console.error('❌ Test query error:', testError)
        throw testError
      }

      // Use testData instead of ordered data since we know it works
      const usersData = testData

      console.log('📊 SettingsPage Using test data as users:')
      console.log('  - Users data:', usersData)
      console.log('  - Users data length:', usersData?.length)

      // Fetch case study requests for each user using admin client
      console.log('🔍 Fetching case study requests with admin client...')
      const { data: requestsData, error: requestsError } = await supabaseAdmin
        .from('case_study_requests')
        .select('user_id, status')

      console.log('📊 SettingsPage Case study requests:', requestsData)
      console.log('📊 SettingsPage Requests error:', requestsError)

      if (requestsError) {
        console.error('❌ SettingsPage Requests error:', requestsError)
        throw requestsError
      }

      // Calculate stats for each user
      console.log('🧮 SettingsPage Calculating user stats...')
      const usersWithStats = (usersData || []).map((user: any, index: any) => {
        const userRequests = requestsData?.filter((req: any) => req.user_id === user.id) || []
        const completedCases = userRequests.filter((req: any) => req.status === 'corrected').length
        const totalRequests = userRequests.length
        const pendingCases = userRequests.filter((req: any) => req.status !== 'corrected').length

        const stats = {
          ...user,
          totalRequests,
          completedCases,
          pendingCases
        }

        console.log(`📈 SettingsPage Stats for user ${index + 1} (${user.email}):`, stats)
        return stats
      })

      console.log('✅ SettingsPage Final users with stats:', usersWithStats)
      console.log('✅ SettingsPage Final array length:', usersWithStats.length)
      console.log('✅ SettingsPage About to call setUsers...')
      
      setUsers(usersWithStats)
      
      console.log('✅ SettingsPage setUsers called successfully')
    } catch (error) {
      console.error('❌ SettingsPage Error fetching users:', error)
    } finally {
      console.log('🔄 SettingsPage Setting loading to false')
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!newUser.email || !newUser.first_name || !newUser.last_name || !newUser.password) {
      alert('Bitte füllen Sie alle Felder aus.')
      return
    }

    if (newUser.password.length < 6) {
      alert('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    try {
      const userData: CreateUserData = {
        email: newUser.email,
        password: newUser.password,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role as 'student' | 'instructor' | 'admin'
      }

      const result = await createUserAsAdmin(userData)
      
      if (result.success) {
        alert(`${newUser.role === 'instructor' ? 'Dozent' : newUser.role === 'admin' ? 'Administrator' : 'Student'} erfolgreich erstellt!`)
        setNewUser({ email: '', first_name: '', last_name: '', role: 'student', password: '' })
        fetchUsersWithStats()
      } else {
        alert('Fehler beim Erstellen des Benutzers: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Fehler beim Erstellen des Benutzers: ' + (error as any).message)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabaseAdmin
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
      // Delete from auth.users first (this will cascade to public.users)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (authError) throw authError

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
      const newTotal = (selectedUser.account_credits || 0) + amount

      const { error } = await supabaseAdmin
        .from('users')
        .update({ account_credits: newTotal })
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

  const updateEmailNotifications = async (enabled: boolean) => {
    if (!currentUser) return

    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ email_notifications_enabled: enabled })
        .eq('id', currentUser.id)

      if (error) throw error

      setEmailNotificationsEnabled(enabled)

      // Transfer cases when going on vacation or returning
      if (!enabled && currentUser?.id) {
        // Going on vacation - transfer cases to springer
        console.log('🏖️ Transferring cases to springer...')
        await transferCasesToSpringer(currentUser.id, 'vacation_start')
        alert('E-Mail-Benachrichtigungen wurden deaktiviert.\n\n🔄 Alle offenen Aufträge wurden an Springer übertragen.\nSpringer werden nun benachrichtigt.')
      } else if (enabled && currentUser?.id) {
        // Returning from vacation - transfer cases back
        console.log('🎯 Transferring cases back from springer...')
        await transferCasesToSpringer(currentUser.id, 'vacation_end')
        alert('E-Mail-Benachrichtigungen wurden aktiviert.\n\n🔄 Alle Aufträge wurden von Springern zurück übertragen.')
      }
      
      // Refresh profile
      fetchCurrentUserRole()
    } catch (error) {
      console.error('Error updating email notifications:', error)
      alert('Fehler beim Aktualisieren der E-Mail-Einstellungen')
    }
  }

  const openVacationModal = () => {
    const today = new Date().toISOString().split('T')[0]
    setVacationStartDate(today)
    setVacationEndDate(today)
    setVacationModalOpen(true)
  }

  const closeVacationModal = () => {
    setVacationModalOpen(false)
    setVacationStartDate('')
    setVacationEndDate('')
  }

  const transferCasesToSpringer = async (instructorId: string, reason: 'vacation_start' | 'vacation_end') => {
    try {
      console.log(`🔄 Calling transfer-cases function with reason: ${reason}`)
      
      const { data, error } = await supabaseAdmin.functions.invoke('transfer-cases', {
        body: {
          instructor_id: instructorId,
          reason: reason
        }
      })

      if (error) {
        console.error('Error calling transfer-cases function:', error)
        throw error
      }

      console.log('Transfer result:', data)
      return data
    } catch (error) {
      console.error('Error transferring cases:', error)
      throw error
    }
  }

  const setVacationPeriod = async () => {
    if (!vacationStartDate || !vacationEndDate) {
      alert('Bitte wählen Sie Start- und Enddatum aus.')
      return
    }

    if (new Date(vacationStartDate) > new Date(vacationEndDate)) {
      alert('Das Startdatum muss vor dem Enddatum liegen.')
      return
    }

    try {
      // Store vacation dates in database and deactivate notifications
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          email_notifications_enabled: false,
          vacation_start_date: vacationStartDate,
          vacation_end_date: vacationEndDate,
          vacation_reason: 'Geplanter Urlaub'
        })
        .eq('id', currentUser?.id)

      if (error) throw error

      setEmailNotificationsEnabled(false)
      
      // Transfer cases to springer
      console.log('🏖️ Transferring cases to springer for planned vacation...')
      if (currentUser?.id) {
        await transferCasesToSpringer(currentUser.id, 'vacation_start')
      }
      
      const startFormatted = new Date(vacationStartDate).toLocaleDateString('de-DE')
      const endFormatted = new Date(vacationEndDate).toLocaleDateString('de-DE')
      
      alert(`🏖️ Urlaubsmodus aktiviert!\n\nVom ${startFormatted} bis ${endFormatted}:\n🔄 Alle offenen Aufträge wurden an Springer übertragen\n📧 Springer werden über neue Klausuren benachrichtigt\n⏰ Automatische Rückkehr am ${endFormatted}\n\nViel Spaß im Urlaub! 🌴`)
      
      closeVacationModal()
      fetchCurrentUserRole() // Refresh profile
    } catch (error) {
      console.error('Error setting vacation period:', error)
      alert('Fehler beim Aktivieren des Urlaubsmodus')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      (user.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Debug filtering in SettingsPage
  console.log('🔍 SettingsPage Filtering Debug:')
  console.log('  - users array length:', users.length)
  console.log('  - users array:', users)
  console.log('  - searchTerm:', searchTerm)
  console.log('  - roleFilter:', roleFilter)
  console.log('  - filteredUsers length:', filteredUsers.length)
  console.log('  - filteredUsers:', filteredUsers)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Einstellungen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
          </div>
          <p className="text-gray-600">
            {currentUserRole === 'student' 
              ? 'Verwalte dein Profil und Einstellungen'
              : 'Verwalten Sie Ihr Profil und Systemeinstellungen'
            }
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profil
            </button>
            {currentUserRole === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('user-management')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'user-management'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Benutzerverwaltung
                </button>
                <button
                  onClick={() => setActiveTab('create-user')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'create-user'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Benutzer erstellen
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            {/* Profile Image Section - Only for Instructors, Springer, and Admins */}
            {(currentUserRole === 'instructor' || currentUserRole === 'springer' || currentUserRole === 'admin') && currentUser && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-3">
                  <User className="w-6 h-6 text-blue-600" />
                  Profilbild
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Laden Sie ein Profilbild hoch, um Ihre Interaktionen mit Studenten persönlicher zu gestalten. 
                  Ihr Profilbild wird Studenten angezeigt, wenn Sie Korrekturen oder Nachrichten senden.
                </p>
                
                <ProfileImageUpload
                  currentImageUrl={currentUserProfile?.profile_image_url}
                  userId={currentUser.id}
                  onImageUpdate={handleProfileImageUpdate}
                  size="lg"
                />
              </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Profil Informationen</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                  <div className="mt-1 text-sm text-gray-900">{currentUser?.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rolle</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      currentUserRole === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                      currentUserRole === 'instructor' ? 'bg-purple-100 text-purple-800' :
                      currentUserRole === 'springer' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {(() => {
                        if (currentUserRole === 'admin') return 'Administrator';
                        if (currentUserRole === 'instructor') {
                          return currentUserProfile?.instructor_legal_area 
                            ? `Dozent ${currentUserProfile.instructor_legal_area}`
                            : 'Dozent';
                        }
                        if (currentUserRole === 'springer') {
                          return currentUserProfile?.instructor_legal_area 
                            ? `Springer ${currentUserProfile.instructor_legal_area}`
                            : 'Springer';
                        }
                        return 'Student';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Notifications Settings - Only for Instructors and Springer */}
            {(currentUserRole === 'instructor' || currentUserRole === 'springer') && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-3">
                  <Bell className="w-6 h-6 text-blue-600" />
                  E-Mail-Benachrichtigungen
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {emailNotificationsEnabled ? (
                        <Mail className="w-5 h-5 text-green-600" />
                      ) : (
                        <MailX className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          E-Mail-Benachrichtigungen
                        </h3>
                        <p className="text-sm text-gray-500">
                          {emailNotificationsEnabled 
                            ? 'Sie erhalten E-Mails bei neuen Klausuren und Chat-Nachrichten'
                            : 'E-Mail-Benachrichtigungen sind deaktiviert - Springer werden bei Klausuren benachrichtigt'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => updateEmailNotifications(!emailNotificationsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Vacation Mode Section */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="space-y-4">
                      {/* Manual Vacation Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">🏖️</div>
                          <div>
                            <h4 className="text-sm font-medium text-blue-800">
                              Schneller Urlaubsmodus
                            </h4>
                            <p className="text-sm text-blue-700">
                              Sofort aktivieren/deaktivieren ohne Kalenderdaten
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateEmailNotifications(emailNotificationsEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            !emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                          title={!emailNotificationsEnabled ? 'Urlaubsmodus deaktivieren' : 'Urlaubsmodus aktivieren'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              !emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {/* Calendar Planning */}
                      <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">🌴</div>
                          <div>
                            <h4 className="text-sm font-medium text-blue-800">
                              Geplanter Urlaub
                            </h4>
                            <p className="text-sm text-blue-700">
                              Urlaubsmodus mit Kalenderdaten planen
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={openVacationModal}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          Urlaub planen
                        </button>
                      </div>
                    </div>
                  </div>

                  {!emailNotificationsEnabled && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🌴</div>
                        <div>
                          <h4 className="text-sm font-medium text-amber-800">
                            Urlaubsvertretung aktiv
                          </h4>
                          <p className="mt-1 text-sm text-amber-700">
                            Während Ihre E-Mail-Benachrichtigungen deaktiviert sind, werden automatisch 
                            die Springer für {currentUserProfile?.instructor_legal_area || 'Ihr Rechtsgebiet'} benachrichtigt.
                          </p>
                          <p className="mt-2 text-xs text-amber-600">
                            Genießen Sie Ihren wohlverdienten Urlaub! 🏖️
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Management Tab - Only for Admins */}
        {activeTab === 'user-management' && currentUserRole === 'admin' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Gesamt Benutzer</p>
                    <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <GraduationCap className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Dozenten</p>
                    <p className="text-2xl font-semibold text-gray-900">{users.filter(u => u.role === 'instructor').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Studenten</p>
                    <p className="text-2xl font-semibold text-gray-900">{users.filter(u => u.role === 'student').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Crown className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Admins</p>
                    <p className="text-2xl font-semibold text-gray-900">{users.filter(u => u.role === 'admin').length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Benutzer suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Alle Rollen</option>
                  <option value="admin">Administratoren</option>
                  <option value="instructor">Dozenten</option>
                  <option value="student">Studenten</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benutzer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktivität</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registriert</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {/* Show profile image for instructors, springer, and admins */}
                            {(user.role === 'instructor' || user.role === 'springer' || user.role === 'admin') ? (
                              <ProfileImage
                                imageUrl={user.profile_image_url}
                                name={`${user.first_name || ''} ${user.last_name || ''}`.trim()}
                                size="sm"
                              />
                            ) : (
                              <>
                                {user.role === 'admin' && <Crown className="w-5 h-5 text-yellow-500" />}
                                {user.role === 'instructor' && <GraduationCap className="w-5 h-5 text-green-500" />}
                                {user.role === 'student' && <Users className="w-5 h-5 text-blue-500" />}
                              </>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary"
                          >
                            <option value="student">Student</option>
                            <option value="instructor">Dozent</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {user.account_credits || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <div className="text-xs text-gray-500">
                              Anfragen: {user.totalRequests || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              Abgeschlossen: {user.completedCases || 0}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setGrantModalOpen(true)
                              }}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Credits hinzufügen"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="text-red-600 hover:text-red-900 p-1"
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

        {/* Create User Tab - Only for Admins */}
        {activeTab === 'create-user' && currentUserRole === 'admin' && (
          <div className="max-w-2xl">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-primary" />
                Neuen Benutzer erstellen
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vorname</label>
                    <input
                      type="text"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Vorname eingeben"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nachname</label>
                    <input
                      type="text"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Nachname eingeben"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="E-Mail eingeben"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Passwort eingeben"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Benutzerrolle</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Dozent</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setNewUser({ email: '', first_name: '', last_name: '', role: 'student', password: '' })}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
                  >
                    Zurücksetzen
                  </button>
                  <button
                    onClick={createUser}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Benutzer erstellen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grant Credits Modal */}
        {grantModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-3">
                <Plus className="w-5 h-5 text-green-600" />
                Klausuren-Credits hinzufügen
              </h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Benutzer: <span className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Aktuelle Credits: <span className="font-medium text-green-600">{selectedUser.account_credits || 0}</span>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anzahl Credits hinzufügen
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary"
                    placeholder="Anzahl eingeben"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setGrantModalOpen(false)
                    setSelectedUser(null)
                    setGrantAmount('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Abbrechen
                </button>
                <button
                  onClick={grantCaseStudies}
                  disabled={!grantAmount || parseInt(grantAmount) <= 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vacation Planning Modal */}
        {vacationModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-3">
                <div className="text-2xl">🏖️</div>
                <span>Urlaubsplanung</span>
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-4xl mb-2">🌴</div>
                  <p className="text-sm text-blue-700 font-medium">
                    Planen Sie Ihren wohlverdienten Urlaub!
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Urlaubsbeginn
                  </label>
                  <input
                    type="date"
                    value={vacationStartDate}
                    onChange={(e) => setVacationStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Urlaubsende
                  </label>
                  <input
                    type="date"
                    value={vacationEndDate}
                    onChange={(e) => setVacationEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-lg">⚠️</div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Wichtiger Hinweis</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Während Ihres Urlaubs werden automatisch die Springer für Ihr Rechtsgebiet 
                        ({currentUserProfile?.instructor_legal_area}) über neue Klausuren benachrichtigt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={setVacationPeriod}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                >
                  <div className="text-lg">🏖️</div>
                  Urlaub aktivieren
                  <div className="text-lg">🌴</div>
                </button>
                <button
                  onClick={closeVacationModal}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
