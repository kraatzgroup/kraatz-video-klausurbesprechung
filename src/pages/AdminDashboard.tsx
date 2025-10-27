import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabaseAdmin } from '../lib/supabase-admin'
import { 
  Users, 
  BarChart3, 
  Star, 
  Crown,
  UserPlus,
  Shield,
  TrendingUp,
  Award,
  CheckCircle,
  Edit,
  Trash2,
  DollarSign,
  MessageCircle,
  FileText
} from 'lucide-react'
import { createUserAsAdmin, CreateUserData } from '../utils/adminUtils'


interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  instructor_legal_area?: string
  email_notifications_enabled?: boolean
  account_credits: number
  available_case_studies: number
  used_case_studies: number
  created_at: string
  totalRequests: number
  completedCases: number
  pendingCases: number
}

interface CaseStudyRating {
  id: string
  rating: number
  feedback: string
  created_at: string
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  case_study_request?: {
    id: string
    legal_area: string
    sub_area: string
    focus_area?: string
    assigned_instructor?: {
      id: string
      first_name: string
      last_name: string
      email: string
      instructor_legal_area?: string
    }
  }
}

const AdminDashboard: React.FC = () => {
  const location = useLocation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'ratings' | 'masterclass'>('overview')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'instructor' | 'admin' | 'springer'>('all')
  const [ratings, setRatings] = useState<CaseStudyRating[]>([])
  const [instructorFilter, setInstructorFilter] = useState<string>('all')
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [roleChangeModalOpen, setRoleChangeModalOpen] = useState(false)
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<User | null>(null)
  const [newRoleData, setNewRoleData] = useState<{role: string, instructorLegalArea?: string}>({role: ''})
  
  // Form states
  const [grantAmount, setGrantAmount] = useState('')
  const [newUserData, setNewUserData] = useState<CreateUserData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
    instructorLegalArea: undefined
  })

  // Derived data
  const students = users.filter(u => u.role === 'student')
  const instructors = users.filter(u => u.role === 'instructor')
  const admins = users.filter(u => u.role === 'admin')
  const springer = users.filter(u => u.role === 'springer')

  useEffect(() => {
    fetchUsers()
    
    // Parse URL query parameter for tab
    const searchParams = new URLSearchParams(location.search)
    const tabParam = searchParams.get('tab')
    if (tabParam === 'ratings' || tabParam === 'users' || tabParam === 'overview' || tabParam === 'masterclass') {
      setActiveTab(tabParam as 'overview' | 'users' | 'ratings' | 'masterclass')
    }
    
    // Handle navigation state (fallback)
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab)
    }
  }, [location.search, location.state])

  // Fetch ratings when ratings tab is active
  useEffect(() => {
    if (activeTab === 'ratings') {
      fetchRatings()
    }
  }, [activeTab])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Get case study statistics for each user
      const usersWithStats = await Promise.all(
        (usersData || []).map(async (user: any) => {
          const { data: requests } = await (supabaseAdmin as any)
            .from('case_study_requests')
            .select('id, status')
            .eq('user_id', user.id)

          const totalRequests = requests?.length || 0
          const completedCases = requests?.filter((r: any) => r.status === 'completed').length || 0
          const pendingCases = requests?.filter((r: any) => r.status !== 'completed').length || 0

          return {
            ...user,
            totalRequests,
            completedCases,
            pendingCases
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

  const fetchRatings = async () => {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('case_study_ratings')
        .select(`
          id,
          rating,
          feedback,
          created_at,
          user_id,
          case_study_id,
          users!inner(id, first_name, last_name, email),
          case_study_requests!case_study_id(
            id,
            legal_area,
            sub_area,
            focus_area,
            assigned_instructor_id,
            assigned_instructor:assigned_instructor_id(
              id,
              first_name,
              last_name,
              email,
              instructor_legal_area
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('❌ Error fetching ratings:', error)
        throw error
      }
      
      console.log('✅ Fetched ratings:', data)
      
      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        rating: item.rating,
        feedback: item.feedback,
        created_at: item.created_at,
        user: {
          id: item.users.id,
          first_name: item.users.first_name,
          last_name: item.users.last_name,
          email: item.users.email
        },
        case_study_request: {
          id: item.case_study_requests.id,
          legal_area: item.case_study_requests.legal_area,
          sub_area: item.case_study_requests.sub_area,
          focus_area: item.case_study_requests.focus_area,
          assigned_instructor: item.case_study_requests.assigned_instructor ? {
            id: item.case_study_requests.assigned_instructor.id,
            first_name: item.case_study_requests.assigned_instructor.first_name,
            last_name: item.case_study_requests.assigned_instructor.last_name,
            email: item.case_study_requests.assigned_instructor.email,
            instructor_legal_area: item.case_study_requests.assigned_instructor.instructor_legal_area
          } : undefined
        }
      })) as CaseStudyRating[]
      
      console.log('✅ Transformed ratings:', transformedData)
      setRatings(transformedData)
    } catch (error) {
      console.error('❌ Error fetching ratings:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Get all instructors from users list (not just those with ratings)
  const getAllInstructors = () => {
    return instructors.sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }

  // Filter and group ratings by instructor
  const getFilteredRatings = () => {
    if (instructorFilter === 'all') {
      return ratings
    }
    return ratings.filter(rating => 
      rating.case_study_request?.assigned_instructor?.id === instructorFilter
    )
  }

  // Group ratings by instructor with statistics (includes all instructors, even without ratings)
  const getRatingsByInstructor = () => {
    const grouped = new Map<string, {
      instructor: any,
      ratings: CaseStudyRating[],
      averageRating: number,
      totalRatings: number
    }>()

    // Get all instructors or filtered instructor
    const instructorsToShow = instructorFilter === 'all' 
      ? getAllInstructors() 
      : instructors.filter(i => i.id === instructorFilter)

    // Initialize all instructors with empty ratings
    instructorsToShow.forEach(instructor => {
      grouped.set(instructor.id, {
        instructor,
        ratings: [],
        averageRating: 0,
        totalRatings: 0
      })
    })

    // Add ratings to instructors
    const filteredRatings = getFilteredRatings()
    filteredRatings.forEach(rating => {
      const instructor = rating.case_study_request?.assigned_instructor
      if (instructor && grouped.has(instructor.id)) {
        const group = grouped.get(instructor.id)!
        group.ratings.push(rating)
      }
    })

    // Calculate averages
    grouped.forEach(group => {
      group.totalRatings = group.ratings.length
      if (group.totalRatings > 0) {
        group.averageRating = group.ratings.reduce((sum, r) => sum + r.rating, 0) / group.totalRatings
      }
    })

    // Sort by average rating (descending), instructors without ratings at the end
    return Array.from(grouped.values()).sort((a, b) => {
      if (a.totalRatings === 0 && b.totalRatings === 0) {
        // Both have no ratings, sort alphabetically
        return `${a.instructor.first_name} ${a.instructor.last_name}`.localeCompare(
          `${b.instructor.first_name} ${b.instructor.last_name}`
        )
      }
      if (a.totalRatings === 0) return 1 // a has no ratings, put at end
      if (b.totalRatings === 0) return -1 // b has no ratings, put at end
      return b.averageRating - a.averageRating // Sort by rating
    })
  }

  const getRoleDisplay = (user: User) => {
    if (user.role === 'instructor' && user.instructor_legal_area) {
      return `Dozent ${user.instructor_legal_area}`
    }
    if (user.role === 'springer' && user.instructor_legal_area) {
      return `Springer ${user.instructor_legal_area}`
    }
    
    const roleMap = {
      student: 'Student',
      instructor: 'Dozent',
      admin: 'Administrator',
      springer: 'Springer'
    }
    return roleMap[user.role as keyof typeof roleMap] || user.role
  }

  const getRoleBadgeColor = (role: string) => {
    const colorMap = {
      student: 'bg-blue-100 text-blue-800',
      instructor: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      springer: 'bg-indigo-100 text-indigo-800'
    }
    return colorMap[role as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
  }

  // Admin Functions
  const handleGrantCredits = async () => {
    if (!selectedUser || !grantAmount) return
    
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          account_credits: (selectedUser.account_credits || 0) + parseInt(grantAmount)
        })
        .eq('id', selectedUser.id)

      if (error) throw error
      
      await fetchUsers()
      setGrantModalOpen(false)
      setGrantAmount('')
      setSelectedUser(null)
    } catch (error) {
      console.error('Error granting credits:', error)
    }
  }

  const handleCreateUser = async () => {
    try {
      await createUserAsAdmin(newUserData)
      await fetchUsers()
      setCreateUserModalOpen(false)
      setNewUserData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'student',
        instructorLegalArea: undefined
      })
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  const handleRoleChange = async () => {
    if (!selectedUserForRoleChange || !newRoleData.role) return
    
    try {
      const updateData: any = { role: newRoleData.role }
      
      if (newRoleData.role === 'instructor' || newRoleData.role === 'springer') {
        updateData.instructor_legal_area = newRoleData.instructorLegalArea
      } else {
        updateData.instructor_legal_area = null
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', selectedUserForRoleChange.id)

      if (error) throw error
      
      await fetchUsers()
      setRoleChangeModalOpen(false)
      setSelectedUserForRoleChange(null)
      setNewRoleData({role: ''})
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) return
    
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error
      
      await fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const openRoleChangeModal = (user: User) => {
    setSelectedUserForRoleChange(user)
    setNewRoleData({
      role: user.role,
      instructorLegalArea: user.instructor_legal_area
    })
    setRoleChangeModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Vollständige Verwaltung von Benutzern, Dozenten und Klausuren</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Übersicht
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Alle Benutzer
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                    {users.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('ratings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ratings'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Bewertungen
                </div>
              </button>
              <button
                onClick={() => window.location.href = '/masterclass'}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'masterclass'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Masterclass
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Studenten</p>
                        <p className="text-lg sm:text-2xl font-semibold text-gray-900">{students.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Dozenten</p>
                        <p className="text-lg sm:text-2xl font-semibold text-gray-900">{instructors.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <UserPlus className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Springer</p>
                        <p className="text-lg sm:text-2xl font-semibold text-gray-900">{springer.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Admins</p>
                        <p className="text-lg sm:text-2xl font-semibold text-gray-900">{admins.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Gesamt</p>
                        <p className="text-lg sm:text-2xl font-semibold text-gray-900">{users.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      <Users className="w-6 h-6 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Benutzerverwaltung</p>
                        <p className="text-sm text-gray-500">Alle Benutzer verwalten</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('ratings')}
                    className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      <Star className="w-6 h-6 text-yellow-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Bewertungen</p>
                        <p className="text-sm text-gray-500">Feedback und Ratings</p>
                      </div>
                    </div>
                  </button>

                  <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
                    <div className="flex items-center gap-4">
                      <Award className="w-6 h-6 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">System Status</p>
                        <p className="text-sm text-green-600">Alle Systeme online</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Alle Benutzer verwalten</h3>
                  <div className="flex items-center gap-4">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary"
                    >
                      <option value="all">Alle Rollen</option>
                      <option value="student">Studenten</option>
                      <option value="instructor">Dozenten</option>
                      <option value="springer">Springer</option>
                      <option value="admin">Administratoren</option>
                    </select>
                    <button
                      onClick={() => setCreateUserModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-kraatz-primary text-white rounded-lg hover:bg-kraatz-primary/90"
                    >
                      <UserPlus className="w-4 h-4" />
                      Neuen Benutzer erstellen
                    </button>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      Alle Benutzer ({users.filter(u => roleFilter === 'all' || u.role === roleFilter).length})
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Benutzer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rolle
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Verfügbare Credits
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gesamt Anfragen
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Abgeschlossen
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ausstehend
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registriert
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aktionen
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.filter(u => roleFilter === 'all' || u.role === roleFilter).map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-gray-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.first_name || 'Demo'} {user.last_name || 'User'}
                                  </div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                {getRoleDisplay(user)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.account_credits || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.totalRequests}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.completedCases}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.pendingCases}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openRoleChangeModal(user)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Rolle ändern"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setGrantModalOpen(true)
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="Credits gewähren"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Benutzer löschen"
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
                </div>
              </div>
            )}

            {/* Ratings Tab */}
            {activeTab === 'ratings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Bewertungen & Feedback</h3>
                </div>

                {/* Instructor Filter */}
                <div className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <label htmlFor="instructorFilter" className="text-sm font-medium text-gray-700">
                      Dozent filtern:
                    </label>
                    <select
                      id="instructorFilter"
                      value={instructorFilter}
                      onChange={(e) => setInstructorFilter(e.target.value)}
                      className="flex-1 max-w-md rounded-md border-gray-300 shadow-sm focus:border-kraatz-primary focus:ring-kraatz-primary"
                    >
                      <option value="all">Alle Dozenten</option>
                      {getAllInstructors().map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.first_name} {instructor.last_name} - {instructor.instructor_legal_area || 'Kein Rechtsgebiet'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ratings grouped by instructor */}
                <div className="space-y-6">
                  {getRatingsByInstructor().length === 0 ? (
                    <div className="bg-white shadow rounded-lg p-6 text-center">
                      <Star className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Bewertungen</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {instructorFilter === 'all' 
                          ? 'Noch keine Bewertungen von Studenten erhalten.'
                          : 'Dieser Dozent hat noch keine Bewertungen erhalten.'}
                      </p>
                    </div>
                  ) : (
                    getRatingsByInstructor().map((group) => (
                      <div key={group.instructor.id} className="bg-white shadow rounded-lg">
                        {/* Instructor Header with Statistics */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                  {group.instructor.first_name} {group.instructor.last_name}
                                </h2>
                                <p className="text-sm text-gray-600">{group.instructor.email}</p>
                                {group.instructor.instructor_legal_area && (
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    {group.instructor.instructor_legal_area}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-6 w-6 ${
                                      star <= Math.round(group.averageRating)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="text-center">
                                <span className="text-2xl font-bold text-gray-900">
                                  {group.averageRating.toFixed(1)}/5
                                </span>
                                <p className="text-xs text-gray-500">
                                  Ø aus {group.totalRatings} Bewertung{group.totalRatings !== 1 ? 'en' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Individual Ratings for this instructor */}
                        <div className="divide-y divide-gray-200">
                          {group.totalRatings === 0 ? (
                            <div className="p-6 text-center">
                              <Star className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Bewertungen</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Dieser Dozent hat noch keine Bewertungen von Studenten erhalten.
                              </p>
                            </div>
                          ) : (
                            group.ratings.map((rating) => (
                        <div key={rating.id} className="p-6 border-l-4 border-l-blue-500">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                  <Users className="h-6 w-6 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-base font-semibold text-gray-900">
                                  {rating.user.first_name} {rating.user.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{rating.user.email}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Bewertet am {formatDate(rating.created_at)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-5 w-5 ${
                                      star <= rating.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="text-center">
                                <span className="text-lg font-bold text-gray-900">
                                  {rating.rating}/5
                                </span>
                                <div className="text-xs text-gray-500">
                                  {rating.rating === 1 && 'Sehr schlecht'}
                                  {rating.rating === 2 && 'Schlecht'}
                                  {rating.rating === 3 && 'Okay'}
                                  {rating.rating === 4 && 'Gut'}
                                  {rating.rating === 5 && 'Sehr gut'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Klausur-Informationen */}
                          {rating.case_study_request && (
                            <div className="bg-blue-50 rounded-lg p-4 mb-4">
                              <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Bewertete Klausur
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-blue-600 font-medium">Rechtsgebiet:</span>
                                  <div className="font-semibold text-blue-900">
                                    {rating.case_study_request.legal_area}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-blue-600 font-medium">Teilgebiet:</span>
                                  <div className="font-semibold text-blue-900">
                                    {rating.case_study_request.sub_area}
                                  </div>
                                </div>
                                {rating.case_study_request.focus_area && (
                                  <div className="md:col-span-2">
                                    <span className="text-blue-600 font-medium">Schwerpunkt:</span>
                                    <div className="font-semibold text-blue-900">
                                      {rating.case_study_request.focus_area}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Dozenten-Informationen */}
                          {rating.case_study_request?.assigned_instructor && (
                            <div className="bg-green-50 rounded-lg p-4 mb-4">
                              <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-600" />
                                Bewerteter Dozent
                              </h4>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                                  <Shield className="h-5 w-5 text-green-700" />
                                </div>
                                <div>
                                  <div className="font-semibold text-green-900">
                                    {rating.case_study_request.assigned_instructor.first_name} {rating.case_study_request.assigned_instructor.last_name}
                                  </div>
                                  <div className="text-sm text-green-700">
                                    {rating.case_study_request.assigned_instructor.email}
                                  </div>
                                  {rating.case_study_request.assigned_instructor.instructor_legal_area && (
                                    <div className="text-xs text-green-600 font-medium">
                                      Spezialisierung: {rating.case_study_request.assigned_instructor.instructor_legal_area}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Bewertungsdetails */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              Bewertungsdetails
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Sterne-Bewertung:</span>
                                <div className="font-medium text-gray-900">
                                  {rating.rating} von 5 Sternen
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Bewertungstyp:</span>
                                <div className="font-medium text-gray-900">
                                  Klausurenkorrektur-Feedback
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Feedback */}
                          {rating.feedback ? (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                Kritik & Verbesserungswünsche
                              </h4>
                              <p className="text-sm text-blue-900 leading-relaxed">
                                "{rating.feedback}"
                              </p>
                            </div>
                          ) : (
                            <div className="bg-green-50 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Feedback-Status
                              </h4>
                              <p className="text-sm text-green-700">
                                Keine zusätzlichen Verbesserungswünsche angegeben - Student ist zufrieden mit der Korrektur.
                              </p>
                            </div>
                          )}
                        </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create User Modal */}
        {createUserModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Neuen Benutzer erstellen</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Passwort</label>
                    <input
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vorname</label>
                    <input
                      type="text"
                      value={newUserData.firstName}
                      onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nachname</label>
                    <input
                      type="text"
                      value={newUserData.lastName}
                      onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rolle</label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => setNewUserData({...newUserData, role: e.target.value as any})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Dozent</option>
                      <option value="springer">Springer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  {(newUserData.role === 'instructor' || newUserData.role === 'springer') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rechtsgebiet</label>
                      <select
                        value={newUserData.instructorLegalArea || ''}
                        onChange={(e) => setNewUserData({...newUserData, instructorLegalArea: e.target.value as any})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Rechtsgebiet wählen</option>
                        <option value="Zivilrecht">Zivilrecht</option>
                        <option value="Strafrecht">Strafrecht</option>
                        <option value="Öffentliches Recht">Öffentliches Recht</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setCreateUserModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={!newUserData.email || !newUserData.password || !newUserData.firstName || !newUserData.lastName || ((newUserData.role === 'instructor' || newUserData.role === 'springer') && !newUserData.instructorLegalArea)}
                    className="px-4 py-2 bg-kraatz-primary text-white rounded-md hover:bg-kraatz-primary/90 disabled:opacity-50"
                  >
                    Erstellen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Change Modal */}
        {roleChangeModalOpen && selectedUserForRoleChange && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Rolle ändern: {selectedUserForRoleChange.first_name} {selectedUserForRoleChange.last_name}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Neue Rolle</label>
                    <select
                      value={newRoleData.role}
                      onChange={(e) => setNewRoleData({...newRoleData, role: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Rolle wählen</option>
                      <option value="student">Student</option>
                      <option value="instructor">Dozent</option>
                      <option value="springer">Springer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  {(newRoleData.role === 'instructor' || newRoleData.role === 'springer') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rechtsgebiet</label>
                      <select
                        value={newRoleData.instructorLegalArea || ''}
                        onChange={(e) => setNewRoleData({...newRoleData, instructorLegalArea: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Rechtsgebiet wählen</option>
                        <option value="Zivilrecht">Zivilrecht</option>
                        <option value="Strafrecht">Strafrecht</option>
                        <option value="Öffentliches Recht">Öffentliches Recht</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setRoleChangeModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleRoleChange}
                    disabled={!newRoleData.role || ((newRoleData.role === 'instructor' || newRoleData.role === 'springer') && !newRoleData.instructorLegalArea)}
                    className="px-4 py-2 bg-kraatz-primary text-white rounded-md hover:bg-kraatz-primary/90 disabled:opacity-50"
                  >
                    Ändern
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grant Credits Modal */}
        {grantModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Credits gewähren: {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Aktuelle Credits: {selectedUser.account_credits || 0}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Credits hinzufügen</label>
                    <input
                      type="number"
                      value={grantAmount}
                      onChange={(e) => setGrantAmount(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Anzahl Credits"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setGrantModalOpen(false)
                      setGrantAmount('')
                      setSelectedUser(null)
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleGrantCredits}
                    disabled={!grantAmount || parseInt(grantAmount) <= 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Credits gewähren
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
