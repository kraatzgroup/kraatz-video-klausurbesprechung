import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, Plus,Award, UserPlus, BarChart3, Crown, Trash2} from 'lucide-react';
import { createUserAsAdmin, CreateUserData } from '../utils/adminUtils';
import { getUserLegalAreas, formatLegalAreasDisplay, type LegalArea } from '../utils/legalAreaUtils';
import LegalAreaMultiSelect from '../components/LegalAreaMultiSelect';
import AdminCasesOverview from '../components/AdminCasesOverview';
import AdminActivityDashboard from '../components/AdminActivityDashboard';
import { useNavigate } from 'react-router-dom';

// Create admin client for user management operations
// In production, this should be moved to a secure server-side environment
const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co',
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'
);

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  instructor_legal_area?: string; // Legacy field
  legal_areas?: string[]; // New multi-area field
  email_notifications_enabled?: boolean;
  account_credits: number;
  created_at: string;
}

interface UserStats {
  user: User;
  totalRequests: number;
  completedCases: number;
  pendingCases: number;
}

const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'cases' | 'live'>('users');
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantAmount, setGrantAmount] = useState('');
  const [searchTerm, setTerm] = useState('');
  const [rolesetRole] = useState<'all' | 'student' | 'instructor' | 'admin' | 'springer'>('all');
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
    instructorLegalArea: undefined as LegalArea | undefined,
    legalAreas: [] as LegalArea[]
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [roleChangeModalOpen, setRoleChangeModalOpen] = useState(false);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<User | null>(null);
  const [newRoleData, setNewRoleData] = useState({
    role: 'student' as 'student' | 'instructor' | 'admin' | 'springer',
    instructorLegalArea: undefined as LegalArea | undefined,
    legalAreas: [] as LegalArea[]
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUserForDeletion, setSelectedUserForDeletion] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    console.log('🚀 Component mounted, calling fetchUsersWithStats');
    fetchUsersWithStats();
  }, []);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 users state changed:', {
      length: users.length,
      users: users
    });
  }, [users]);

  useEffect(() => {
    console.log('🔄 loading state changed:', loading);
  }, [loading]);

  const fetchUsersWithStats = async () => {
    console.log('🔄 fetchUsersWithStats called');
    try {
      setLoading(true);
      console.log('🔄 Loading set to true');

      // Fetch all users using admin client to bypass RLS
      console.log('🔍 Fetching users from database...');
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Raw database response:');
      console.log('  - Users data:', usersData);
      console.log('  - Users error:', usersError);
      console.log('  - Users data length:', usersData?.length);
      console.log('  - Users data type:', typeof usersData);
      console.log('  - Is array?', Array.isArray(usersData));

      if (usersError) {
        console.error('❌ Database error:', usersError);
        throw usersError;
      }

      if (!usersData) {
        console.warn('⚠️ No users data returned from database');
        setUsers([]);
        return;
      }

      // Log each user individually
      usersData.forEach((user, index) => {
        console.log(`👤 User ${index + 1}:`, {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        });
      });

      // Fetch case study requests for each user using admin client
      console.log('🔍 Fetching case study requests...');
      const { data: requestsData, error: requestsError } = await supabaseAdmin
        .from('case_study_requests')
        .select('user_id, status');

      console.log('📊 Case study requests:', requestsData);
      console.log('📊 Requests error:', requestsError);

      if (requestsError) {
        console.error('❌ Requests error:', requestsError);
        throw requestsError;
      }

      // Calculate stats for each user
      console.log('🧮 Calculating user stats...');
      const userStats: UserStats[] = (usersData || []).map((user, index) => {
        const userRequests = requestsData?.filter(req => req.user_id === user.id) || [];
        const completedCases = userRequests.filter(req => req.status === 'corrected').length;
        const pendingCases = userRequests.filter(req => req.status !== 'corrected').length;

        const stats = {
          user,
          totalRequests: userRequests.length,
          completedCases,
          pendingCases
        };

        console.log(`📈 Stats for user ${index + 1} (${user.email}):`, stats);
        return stats;
      });

      console.log('✅ Final users with stats:', userStats);
      console.log('✅ Final array length:', userStats.length);
      console.log('✅ About to call setUsers...');
      
      setUsers(userStats);
      
      console.log('✅ setUsers called successfully');
    } catch (error) {
      console.error('❌ Error in fetchUsersWithStats:', error);
      console.error('❌ Error stack:', (error as Error).stack);
      alert('Fehler beim Laden der Benutzer: ' + (error as Error).message);
    } finally {
      console.log('🔄 Setting loading to false');
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

  const openRoleChangeModal = (user: User) => {
    setSelectedUserForRoleChange(user);
    const userLegalAreas = getUserLegalAreas(user);
    setNewRoleData({
      role: user.role as 'student' | 'instructor' | 'admin' | 'springer',
      instructorLegalArea: user.instructor_legal_area as 'Zivilrecht' | 'Strafrecht' | 'Öffentliches Recht' | undefined,
      legalAreas: userLegalAreas
    });
    setRoleChangeModalOpen(true);
  };

  const closeRoleChangeModal = () => {
    setRoleChangeModalOpen(false);
    setSelectedUserForRoleChange(null);
    setNewRoleData({
      role: 'student',
      instructorLegalArea: undefined,
      legalAreas: []
    });
  };

  const openDeleteModal = (user: User) => {
    setSelectedUserForDeletion(user);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedUserForDeletion(null);
  };

  const deleteUser = async () => {
    if (!selectedUserForDeletion) return;

    setDeleteLoading(true);

    try {
      // First delete from users table
      const { error: userError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', selectedUserForDeletion.id);

      if (userError) throw userError;

      // Then delete from Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
        selectedUserForDeletion.id
      );

      if (authError) {
        console.warn('Warning: User deleted from database but auth deletion failed:', authError);
        // Continue anyway as the main user record is deleted
      }

      alert(`Benutzer ${selectedUserForDeletion.first_name} ${selectedUserForDeletion.last_name} wurde erfolgreich gelöscht.`);
      
      // Refresh the user list
      fetchUsersWithStats();
      closeDeleteModal();

    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Fehler beim Löschen des Benutzers. Bitte versuchen Sie es erneut.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const updateUserRole = async () => {
    if (!selectedUserForRoleChange) return;

    try {
      const updateData: any = { role: newRoleData.role };
      
      // Set or clear legal areas based on role
      if (newRoleData.role === 'instructor' || newRoleData.role === 'springer') {
        if (newRoleData.legalAreas && newRoleData.legalAreas.length > 0) {
          updateData.legal_areas = newRoleData.legalAreas;
          updateData.instructor_legal_area = newRoleData.legalAreas[0]; // Keep legacy field for compatibility
        } else if (newRoleData.instructorLegalArea) {
          updateData.legal_areas = [newRoleData.instructorLegalArea];
          updateData.instructor_legal_area = newRoleData.instructorLegalArea;
        }
      } else {
        updateData.legal_areas = null;
        updateData.instructor_legal_area = null;
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', selectedUserForRoleChange.id);

      if (error) throw error;

      alert('Benutzerrolle erfolgreich aktualisiert!');
      fetchUsersWithStats();
      closeRoleChangeModal();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Fehler beim Aktualisieren der Rolle.');
    }
  };

  //users based on search and role
  const filteredUsers = users.filter(userStat => {
    const matches= searchTerm === '' || 
      (userStat.user.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userStat.user.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      userStat.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = role=== 'all' || userStat.user.role === role;
    return matches&& matchesRole;
  });

  // Debug filtering
  console.log('🔍ing Debug:');
  console.log('  - users array length:', users.length);
  console.log('  - users array:', users);
  console.log('  - searchTerm:', searchTerm);
  console.log('  - role:', role);
  console.log('  - filteredUsers length:', filteredUsers.length);
  console.log('  - filteredUsers:', filteredUsers);

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
      const newTotal = (selectedUser.account_credits || 0) + amount;

      const { error } = await supabaseAdmin
        .from('users')
        .update({ account_credits: newTotal })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Refresh data
      fetchUsersWithStats();
      closeGrantModal();
      alert(`${amount} Klausuren erfolgreich für ${selectedUser.first_name} ${selectedUser.last_name} freigeschaltet!`);
    } catch (error) {
      console.error('Error granting case studies:', error);
      alert('Fehler beim Freischalten der Klausuren.');
    }
  };

  const openCreateUserModal = () => {
    setNewUserData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'student',
      instructorLegalArea: undefined as LegalArea | undefined,
      legalAreas: []
    });
    setCreateUserModalOpen(true);
  };

  const closeCreateUserModal = () => {
    setCreateUserModalOpen(false);
    setNewUserData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'student',
      instructorLegalArea: undefined as LegalArea | undefined,
      legalAreas: []
    });
  };

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.firstName || !newUserData.lastName || !newUserData.role) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }

    if (newUserData.password.length < 6) {
      alert('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    // Validate legal area selection for instructors and springer
    if ((newUserData.role === 'instructor' || newUserData.role === 'springer') && newUserData.legalAreas.length === 0) {
      alert('Bitte wählen Sie mindestens ein Rechtsgebiet aus.');
      return;
    }

    setCreateUserLoading(true);

    try {
      const userData: CreateUserData = {
        email: newUserData.email,
        password: newUserData.password,
        firstName: newUserData.firstName,
        lastName: newUserData.lastName,
        role: newUserData.role as 'student' | 'instructor' | 'admin' | 'springer',
        instructorLegalArea: newUserData.legalAreas.length > 0 ? newUserData.legalAreas[0] : undefined,
        legalAreas: newUserData.legalAreas.length > 0 ? newUserData.legalAreas : undefined
      };

      const existingUser = users.find(userStat => userStat.user.email.toLowerCase() === newUserData.email.toLowerCase());
      if (existingUser) {
        alert('Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.');
        return;
      }

      const result = await createUserAsAdmin(userData);
      
      if (result.success) {
        alert(result.message);
        // Wait a moment before refreshing to ensure database consistency
        setTimeout(() => {
          fetchUsersWithStats();
        }, 1000);
        closeCreateUserModal();
      } else {
        // Handle specific error messages
        if (result.error && result.error.includes('already been registered')) {
          alert('Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.');
        } else {
          alert(`Fehler beim Erstellen des Benutzers: ${result.error}`);
        }
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle specific error messages
      if (error.message && error.message.includes('already been registered')) {
        alert('Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.');
      } else if (error.message && error.message.includes('Auth creation failed')) {
        alert('Fehler bei der Benutzer-Authentifizierung. Bitte versuchen Sie es erneut.');
      } else {
        alert('Unerwarteter Fehler beim Erstellen des Benutzers.');
      }
    } finally {
      setCreateUserLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kraatz-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Benutzerdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-yellow-600" />
                <h2 className="text-lg font-semibold text-gray-900">Admin Dashboard</h2>
              </div>
              <div className="flex gap-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-kraatz-primary text-white rounded-lg font-medium cursor-default">
                  <Users className="w-4 h-4" />
                  Benutzerverwaltung
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">Aktiv</span>
                </div>
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  System Übersicht
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-kraatz-primary" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            {activeTab === 'users' && (
              <button
                onClick={openCreateUserModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-kraatz-primary text-white rounded-lg hover:bg-kraatz-primary/90 font-medium"
              >
                <UserPlus className="w-5 h-5" />
                Neuen Benutzer erstellen
              </button>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
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
                  Benutzerverwaltung
                </div>
              </button>
              <button
                onClick={() => setActiveTab('cases')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cases'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <className="w-4 h-4" />
                  Alle Aufträge
                </div>
              </button>
              <button
                onClick={() => setActiveTab('live')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'live'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Aktivitätsprotokoll
                </div>
              </button>
            </nav>
          </div>
          
          <p className="text-gray-600">
            {activeTab === 'users' 
              ? 'Übersicht aller Benutzer und deren Klausur-Aktivitäten'
              : activeTab === 'cases'
              ? 'Zentrale Übersicht aller Klausur-Aufträge aus allen Rechtsgebieten'
              : 'Chronologische Historie aller Dozenten-Aktivitäten'
            }
          </p>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Studenten</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(() => {
                    const studentCount = users.filter(u => u.user.role === 'student').length;
                    console.log('📊 Student count calculation:', {
                      totalUsers: users.length,
                      studentCount: studentCount,
                      students: users.filter(u => u.user.role === 'student').map(u => u.user.email)
                    });
                    return studentCount;
                  })()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Dozenten</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.user.role === 'instructor').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Springer</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.user.role === 'springer').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Gesamt Klausuren</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.reduce((sum, u) => sum + u.totalRequests, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Plus className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Verfügbare Credits</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.reduce((sum, u) => sum + (u.user.account_credits || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/*and*/}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Benutzer suchen (Name, E-Mail)..."
                value={searchTerm}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary"
              >
                <option value="all">Alle Rollen</option>
                <option value="student">Studenten</option>
                <option value="instructor">Dozenten</option>
                <option value="admin">Administratoren</option>
                <option value="springer">Springer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Alle Benutzer ({filteredUsers.length})</h2>
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
                {filteredUsers.map((userStat) => (
                  <tr key={userStat.user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-kraatz-primary flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {(userStat.user.first_name?.[0] || 'D')}{(userStat.user.last_name?.[0] || 'U')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userStat.user.first_name || 'Demo'} {userStat.user.last_name || 'User'}
                          </div>
                          <div className="text-sm text-gray-500">{userStat.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userStat.user.role === 'admin' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : userStat.user.role === 'instructor' 
                          ? 'bg-purple-100 text-purple-800' 
                          : userStat.user.role === 'springer'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {(() => {
                          if (userStat.user.role === 'admin') return 'Admin';
                          if (userStat.user.role === 'instructor') {
                            return formatLegalAreasDisplay(getUserLegalAreas(userStat.user), 'instructor');
                          }
                          if (userStat.user.role === 'springer') {
                            return formatLegalAreasDisplay(getUserLegalAreas(userStat.user), 'springer');
                          }
                          return 'Student';
                        })()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          (userStat.user.account_credits || 0) > 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {userStat.user.account_credits || 0}
                        </span>
                        {userStat.user.role === 'student' && (
                          <button
                            onClick={() => openGrantModal(userStat.user)}
                            className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            title="Credits hinzufügen"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Credits
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-medium text-blue-600">
                        {userStat.totalRequests}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-medium text-green-600">
                        {userStat.completedCases}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-medium text-orange-600">
                        {userStat.pendingCases}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userStat.user.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        {userStat.user.role === 'student' && (
                          <button
                            onClick={() => openGrantModal(userStat.user)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-kraatz-primary text-white rounded hover:bg-kraatz-primary/90"
                            title="Klausur-Credits hinzufügen"
                          >
                            <Plus className="w-3 h-3" />
                            Credits
                          </button>
                        )}
                        <button
                          onClick={() => openRoleChangeModal(userStat.user)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          title="Rolle ändern"
                        >
                          Rolle ändern
                        </button>
                        <button
                          onClick={() => openDeleteModal(userStat.user)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Benutzer löschen"
                        >
                          <Trash2 className="w-3 h-3" />
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    Aktuell verfügbar: <span className="font-medium text-green-600">{selectedUser.account_credits || 0}</span> Klausur-Credits
                  </p>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anzahl Credits hinzufügen
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
                    placeholder="z.B. 5 Credits"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleGrantCaseStudies}
                    className="flex-1 bg-kraatz-primary text-white px-4 py-2 rounded-md hover:bg-kraatz-primary/90 font-medium"
                  >
                    Credits hinzufügen
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

        {/* Create User Modal */}
        {createUserModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center gap-3 mb-4">
                  <UserPlus className="w-6 h-6 text-kraatz-primary" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Neuen Benutzer erstellen
                  </h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vorname
                    </label>
                    <input
                      type="text"
                      value={newUserData.firstName}
                      onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
                      placeholder="z.B. Max"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nachname
                    </label>
                    <input
                      type="text"
                      value={newUserData.lastName}
                      onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
                      placeholder="z.B. Mustermann"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
                      placeholder="max.mustermann@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passwort
                    </label>
                    <input
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
                      placeholder="Mindestens 6 Zeichen"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rolle
                    </label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => setNewUserData({...newUserData, role: e.target.value as 'student' | 'instructor' | 'admin' | 'springer', instructorLegalArea: undefined as LegalArea | undefined, legalAreas: []})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Dozent</option>
                      <option value="admin">Administrator</option>
                      <option value="springer">Springer</option>
                    </select>
                  </div>

                  {/* Legal Area Multi-Selection for Instructors and Springer */}
                  {(newUserData.role === 'instructor' || newUserData.role === 'springer') && (
                    <LegalAreaMultiSelect
                      selectedAreas={newUserData.legalAreas}
                      onChange={(areas) => setNewUserData({
                        ...newUserData,
                        legalAreas: areas,
                        instructorLegalArea: areas.length > 0 ? areas[0] : undefined // Keep legacy field for compatibility
                      })}
                      role={newUserData.role}
                    />
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateUser}
                    disabled={createUserLoading}
                    className="flex-1 bg-kraatz-primary text-white px-4 py-2 rounded-md hover:bg-kraatz-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createUserLoading ? 'Erstelle...' : 'Benutzer erstellen'}
                  </button>
                  <button
                    onClick={closeCreateUserModal}
                    disabled={createUserLoading}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium disabled:opacity-50"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Change Modal */}
        {roleChangeModalOpen && selectedUserForRoleChange && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
    <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div className="mt-3">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-6 h-6 text-kraatz-primary" />
          <h3 className="text-lg font-medium text-gray-900">
            Rolle ändern für {selectedUserForRoleChange.first_name} {selectedUserForRoleChange.last_name}
          </h3>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vorname
            </label>
            <input
              type="text"
              value={newUserData.firstName}
              onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
              placeholder="z.B. Max"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nachname
            </label>
            <input
              type="text"
              value={newUserData.lastName}
              onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
              placeholder="z.B. Mustermann"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail
            </label>
            <input
              type="email"
              value={newUserData.email}
              onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
              placeholder="max.mustermann@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={newUserData.password}
              onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
              placeholder="Mindestens 6 Zeichen"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rolle
            </label>
            <select
              value={newUserData.role}
              onChange={(e) => setNewUserData({...newUserData, role: e.target.value as 'student' | 'instructor' | 'admin', instructorLegalArea: undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
            >
              <option value="student">Student</option>
              <option value="instructor">Dozent</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Legal Area Selection for Instructors */}
          {newUserData.role === 'instructor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechtsgebiet
              </label>
              <select
                value={newUserData.instructorLegalArea || ''}
                onChange={(e) => setNewUserData({...newUserData, instructorLegalArea: e.target.value as 'Zivilrecht' | 'Strafrecht' | 'Öffentliches Recht' | undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
                required
              >
                <option value="">Rechtsgebiet auswählen</option>
                <option value="Zivilrecht">Dozent Zivilrecht</option>
                <option value="Strafrecht">Dozent Strafrecht</option>
                <option value="Öffentliches Recht">Dozent Öffentliches Recht</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCreateUser}
            disabled={createUserLoading}
            className="flex-1 bg-kraatz-primary text-white px-4 py-2 rounded-md hover:bg-kraatz-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createUserLoading ? 'Erstelle...' : 'Benutzer erstellen'}
          </button>
          <button
            onClick={closeCreateUserModal}
            disabled={createUserLoading}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium disabled:opacity-50"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Role Change Modal */}
{roleChangeModalOpen && selectedUserForRoleChange && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
    <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div className="mt-3">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-6 h-6 text-kraatz-primary" />
          <h3 className="text-lg font-medium text-gray-900">
            Rolle ändern für {selectedUserForRoleChange.first_name} {selectedUserForRoleChange.last_name}
          </h3>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Neue Rolle
            </label>
            <select
              value={newRoleData.role}
              onChange={(e) => setNewRoleData({
                ...newRoleData, 
                role: e.target.value as 'student' | 'instructor' | 'admin' | 'springer',
                instructorLegalArea: (e.target.value !== 'instructor' && e.target.value !== 'springer') ? undefined : newRoleData.instructorLegalArea,
                legalAreas: (e.target.value !== 'instructor' && e.target.value !== 'springer') ? [] : newRoleData.legalAreas
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
            >
              <option value="student">Student</option>
              <option value="instructor">Dozent</option>
              <option value="admin">Administrator</option>
              <option value="springer">Springer</option>
            </select>
          </div>

          {/* Legal Area Multi-Selection for Instructors and Springer */}
          {(newRoleData.role === 'instructor' || newRoleData.role === 'springer') && (
            <LegalAreaMultiSelect
              selectedAreas={newRoleData.legalAreas}
              onChange={(areas) => setNewRoleData({
                ...newRoleData,
                legalAreas: areas,
                instructorLegalArea: areas.length > 0 ? areas[0] : undefined // Keep legacy field for compatibility
              })}
              role={newRoleData.role}
            />
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={updateUserRole}
            disabled={(newRoleData.role === 'instructor' || newRoleData.role === 'springer') && newRoleData.legalAreas.length === 0}
            className="flex-1 bg-kraatz-primary text-white px-4 py-2 rounded-md hover:bg-kraatz-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rolle ändern
          </button>
          <button
            onClick={closeRoleChangeModal}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  </div>
        )}

        {/* Delete User Modal */}
        {deleteModalOpen && selectedUserForDeletion && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Benutzer löschen
                  </h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Sind Sie sicher, dass Sie den folgenden Benutzer dauerhaft löschen möchten?
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-red-800">
                          {(selectedUserForDeletion.first_name?.[0] || 'U')}{(selectedUserForDeletion.last_name?.[0] || 'U')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedUserForDeletion.first_name} {selectedUserForDeletion.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{selectedUserForDeletion.email}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Rolle: {formatLegalAreasDisplay(getUserLegalAreas(selectedUserForDeletion), selectedUserForDeletion.role)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Warnung</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten des Benutzers werden dauerhaft gelöscht.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={deleteUser}
                    disabled={deleteLoading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteLoading ? 'Lösche...' : 'Dauerhaft löschen'}
                  </button>
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleteLoading}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium disabled:opacity-50"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Cases Overview Tab */}
        </>
        ) : activeTab === 'cases' ? (
          <AdminCasesOverview />
        ) : (
          <AdminActivityDashboard />
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;
