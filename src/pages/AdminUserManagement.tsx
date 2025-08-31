import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { Users, Plus, Eye, Award, UserPlus } from 'lucide-react';
import { createUserAsAdmin, CreateUserData } from '../utils/adminUtils';

// Create admin client for user management operations
const supabaseAdmin = createClient(
  'https://rpgbyockvpannrupicno.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'
);

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
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
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantAmount, setGrantAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'instructor' | 'admin'>('all');
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState<CreateUserData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student'
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);

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

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      alert('Benutzerrolle erfolgreich aktualisiert!');
      fetchUsersWithStats();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Fehler beim Aktualisieren der Rolle.');
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(userStat => {
    const matchesSearch = searchTerm === '' || 
      (userStat.user.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userStat.user.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      userStat.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || userStat.user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Debug filtering
  console.log('🔍 Filtering Debug:');
  console.log('  - users array length:', users.length);
  console.log('  - users array:', users);
  console.log('  - searchTerm:', searchTerm);
  console.log('  - roleFilter:', roleFilter);
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
      role: 'student'
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
      role: 'student'
    });
  };

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.firstName || !newUserData.lastName) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }

    if (newUserData.password.length < 6) {
      alert('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setCreateUserLoading(true);
    try {
      const result = await createUserAsAdmin(newUserData);
      
      if (result.success) {
        alert(result.message);
        fetchUsersWithStats();
        closeCreateUserModal();
      } else {
        alert(`Fehler beim Erstellen des Benutzers: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Unerwarteter Fehler beim Erstellen des Benutzers.');
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-kraatz-primary" />
              <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
            </div>
            <button
              onClick={openCreateUserModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-kraatz-primary text-white rounded-lg hover:bg-kraatz-primary/90 font-medium"
            >
              <UserPlus className="w-5 h-5" />
              Neuen Benutzer erstellen
            </button>
          </div>
          <p className="text-gray-600">Übersicht aller Benutzer und deren Klausur-Aktivitäten</p>
        </div>

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
                <Eye className="h-8 w-8 text-purple-600" />
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

        {/* Search and Filter */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Benutzer suchen (Name, E-Mail)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary"
              >
                <option value="all">Alle Rollen</option>
                <option value="student">Studenten</option>
                <option value="instructor">Dozenten</option>
                <option value="admin">Administratoren</option>
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
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {userStat.user.role === 'admin' ? 'Admin' : userStat.user.role === 'instructor' ? 'Dozent' : 'Student'}
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
                          onClick={() => {
                            const newRole = userStat.user.role === 'student' ? 'instructor' : 'student';
                            if (window.confirm(`Rolle zu ${newRole === 'instructor' ? 'Dozent' : 'Student'} ändern?`)) {
                              updateUserRole(userStat.user.id, newRole);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          title="Rolle ändern"
                        >
                          Rolle ändern
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
                      onChange={(e) => setNewUserData({...newUserData, role: e.target.value as 'student' | 'instructor' | 'admin'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Dozent</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
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
      </div>
    </div>
  );
};

export default AdminUserManagement;
