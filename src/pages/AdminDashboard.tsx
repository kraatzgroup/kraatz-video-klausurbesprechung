import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Users, 
  GraduationCap, 
  FileText, 
  TrendingUp, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  Shield,
  Crown,
  Settings,
  Database,
  Activity,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  BarChart3
} from 'lucide-react'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  account_credits: number
  available_case_studies: number
  used_case_studies: number
  created_at: string
  totalRequests: number
  completedCases: number
  pendingCases: number
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'instructors' | 'create-user'>('overview')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [editUserModalOpen, setEditUserModalOpen] = useState(false)
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [grantAmount, setGrantAmount] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'instructor' | 'admin'>('all')
  const [newUser, setNewUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'student',
    password: ''
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsersWithStats()
  }, [])

  const fetchUsersWithStats = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch case study requests for each user
      const { data: requestsData, error: requestsError } = await supabase
        .from('case_study_requests')
        .select('user_id, status');

      if (requestsError) throw requestsError;

      // Calculate stats for each user
      const userStats: User[] = (usersData || []).map(user => {
        const userRequests = requestsData?.filter(req => req.user_id === user.id) || [];
        const completedCases = userRequests.filter(req => req.status === 'corrected').length;
        const pendingCases = userRequests.filter(req => req.status !== 'corrected').length;

        return {
          ...user,
          available_case_studies: user.available_case_studies || 0,
          used_case_studies: user.used_case_studies || 0,
          totalRequests: userRequests.length,
          completedCases,
          pendingCases
        };
      });

      setUsers(userStats);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openGrantModal = (user: User) => {
    setSelectedUser(user);
    setGrantAmount('');
    setGrantModalOpen(true);
  };

  const closeGrantModal = () => {
    setSelectedUser(null);
    setGrantAmount('');
    setGrantModalOpen(false);
  };

  const handleGrantCaseStudies = async () => {
    if (!selectedUser || !grantAmount) {
      alert('Bitte geben Sie eine Anzahl ein.');
      return;
    }

    const amount = parseInt(grantAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Bitte geben Sie eine gültige positive Zahl ein.');
      return;
    }

    try {
      const newTotal = (selectedUser.available_case_studies || 0) + amount;

      const { error } = await supabase
        .from('users')
        .update({ available_case_studies: newTotal })
        .eq('id', selectedUser.id);

      if (error) throw error;

      fetchUsersWithStats();
      closeGrantModal();
      alert(`${amount} Klausuren erfolgreich für ${selectedUser.first_name} ${selectedUser.last_name} freigeschaltet!`);
    } catch (error) {
      console.error('Error granting case studies:', error);
      alert('Fehler beim Freischalten der Klausuren.');
    }
  };

  const students = users.filter(u => u.role === 'student');
  const instructors = users.filter(u => u.role === 'instructor');
  const totalCaseStudies = users.reduce((sum, u) => sum + (u.totalRequests || 0), 0);
  const totalAvailable = users.reduce((sum, u) => sum + (u.available_case_studies || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kraatz-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Admin-Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-kraatz-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Admin-Dashboard</h1>
          </div>
          <p className="text-gray-600">Vollständige Verwaltung von Benutzern, Dozenten und Klausuren</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-6 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Übersicht
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-3 px-6 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'users'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                Benutzerverwaltung
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {students.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('instructors')}
                className={`py-3 px-6 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'instructors'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Dozenten-Übersicht
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {instructors.length}
                </span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                    <div className="flex items-center">
                      <Users className="h-8 w-8" />
                      <div className="ml-4">
                        <p className="text-blue-100">Gesamt Benutzer</p>
                        <p className="text-2xl font-bold">{users.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
                    <div className="flex items-center">
                      <GraduationCap className="h-8 w-8" />
                      <div className="ml-4">
                        <p className="text-green-100">Aktive Studenten</p>
                        <p className="text-2xl font-bold">{students.filter(s => (s.totalRequests || 0) > 0).length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
                    <div className="flex items-center">
                      <BookOpen className="h-8 w-8" />
                      <div className="ml-4">
                        <p className="text-purple-100">Gesamt Klausuren</p>
                        <p className="text-2xl font-bold">{totalCaseStudies}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
                    <div className="flex items-center">
                      <Award className="h-8 w-8" />
                      <div className="ml-4">
                        <p className="text-orange-100">Verfügbare Klausuren</p>
                        <p className="text-2xl font-bold">{totalAvailable}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Schnellaktionen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Users className="w-6 h-6 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Benutzer verwalten</p>
                        <p className="text-sm text-gray-500">Klausuren zuweisen und verwalten</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('instructors')}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <GraduationCap className="w-6 h-6 text-purple-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Dozenten-Übersicht</p>
                        <p className="text-sm text-gray-500">Dozenten und ihre Aktivitäten</p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <UserPlus className="w-6 h-6 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Neuen Benutzer anlegen</p>
                        <p className="text-sm text-gray-500">Student oder Dozent hinzufügen</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Letzte Aktivitäten</h3>
                  <div className="space-y-3">
                    {users.slice(0, 5).map(userStat => (
                      <div key={userStat.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-kraatz-primary flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {(userStat.first_name?.[0] || 'U')}{(userStat.last_name?.[0] || 'U')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {userStat.first_name || 'Demo'} {userStat.last_name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500">{userStat.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{userStat.totalRequests} Klausuren</p>
                          <p className="text-xs text-gray-500">{userStat.available_case_studies} verfügbar</p>
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Studenten-Verwaltung</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-kraatz-primary text-white rounded-lg hover:bg-kraatz-primary/90">
                    <UserPlus className="w-4 h-4" />
                    Neuen Student anlegen
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verfügbare Klausuren
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Genutzte Klausuren
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
                      {students.map((userStat) => (
                        <tr key={userStat.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-kraatz-primary flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {(userStat.first_name?.[0] || 'D')}{(userStat.last_name?.[0] || 'U')}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {userStat.first_name || 'Demo'} {userStat.last_name || 'User'}
                                </div>
                                <div className="text-sm text-gray-500">{userStat.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-green-600">
                              {userStat.available_case_studies}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-blue-600">
                              {userStat.used_case_studies}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {userStat.totalRequests} Gesamt
                              </span>
                              <span className="text-xs text-gray-500">
                                {userStat.completedCases} abgeschlossen
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(userStat.created_at).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openGrantModal(userStat)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-kraatz-primary text-white rounded hover:bg-kraatz-primary/90"
                            >
                              <Plus className="w-3 h-3" />
                              Gewähren
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Instructors Overview Tab */}
            {activeTab === 'instructors' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Dozenten-Übersicht</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <UserPlus className="w-4 h-4" />
                    Neuen Dozent anlegen
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instructors.map((instructorStat) => (
                    <div key={instructorStat.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {instructorStat.first_name || 'Demo'} {instructorStat.last_name || 'Instructor'}
                          </h4>
                          <p className="text-sm text-gray-500">{instructorStat.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{instructorStat.totalRequests}</p>
                          <p className="text-sm text-blue-700">Bearbeitete Fälle</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{instructorStat.completedCases}</p>
                          <p className="text-sm text-green-700">Abgeschlossen</p>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Seit:</span>
                          <span className="text-gray-500">
                            {new Date(instructorStat.created_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grant Case Studies Modal */}
        {grantModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center gap-3 mb-4">
                  <Plus className="w-6 h-6 text-kraatz-primary" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Klausuren freischalten
                  </h3>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Benutzer: <span className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Aktuell verfügbar: <span className="font-medium text-green-600">{selectedUser.available_case_studies}</span> Klausuren
                  </p>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anzahl zusätzlicher Klausuren
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
                    placeholder="z.B. 5"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleGrantCaseStudies}
                    className="flex-1 bg-kraatz-primary text-white px-4 py-2 rounded-md hover:bg-kraatz-primary/90 font-medium"
                  >
                    Freischalten
                  </button>
                  <button
                    onClick={closeGrantModal}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium"
                  >
                    Abbrechen
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

export default AdminDashboard;
