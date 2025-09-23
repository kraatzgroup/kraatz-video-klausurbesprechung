import React, { useState, useEffect } from 'react';
import { X, Search, Check, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChatUser, 
  getAvailableChatPartners, 
  sortChatPartners, 
  formatUserRole, 
  getRoleColor 
} from '../../utils/chatPermissions';
import { supabase } from '../../lib/supabase';

interface UserSelectorProps {
  onSelectUsers: (userIds: string[]) => Promise<void>;
  onClose: () => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ onSelectUsers, onClose }) => {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<ChatUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<ChatUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'instructor' | 'student' | 'admin'>('all');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load available chat partners
  useEffect(() => {
    const loadUsers = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch current user's role from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, first_name, last_name')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        // Fetch all other users
        const { data: allUsers, error } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, role')
          .neq('id', user.id);

        if (error) throw error;

        // Current user data with correct role from database
        const currentUserData: ChatUser = {
          id: user.id,
          email: user.email || '',
          first_name: userData?.first_name || user.user_metadata?.first_name || '',
          last_name: userData?.last_name || user.user_metadata?.last_name || '',
          role: userData?.role || 'student'
        };

        console.log('👤 UserSelector - Current user:', currentUserData);
        console.log('👥 UserSelector - All users found:', allUsers?.length || 0);

        // Filter based on permissions
        const filteredUsers = getAvailableChatPartners(currentUserData, allUsers || []);
        const sortedUsers = sortChatPartners(filteredUsers);

        console.log('🔍 UserSelector - Filtered users:', filteredUsers.length);
        console.log('📋 UserSelector - Available users:', filteredUsers.map(u => `${u.first_name} ${u.last_name} (${u.role})`));

        setAvailableUsers(sortedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [user]);

  // Filter and search users
  useEffect(() => {
    let filtered = availableUsers;

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    setDisplayedUsers(filtered);
  }, [availableUsers, roleFilter, searchTerm]);


  // Toggle user selection
  const toggleUser = (user: ChatUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Create conversation
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    setCreating(true);
    try {
      await onSelectUsers(selectedUsers.map(u => u.id));
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Neue Unterhaltung</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Benutzer suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kraatz-primary focus:border-transparent text-sm"
            />
          </div>
          
          {/* Role Filter */}
          <div className="flex gap-1">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                roleFilter === 'all' 
                  ? 'bg-kraatz-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setRoleFilter('instructor')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                roleFilter === 'instructor' 
                  ? 'bg-kraatz-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Dozenten
            </button>
            <button
              onClick={() => setRoleFilter('student')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                roleFilter === 'student' 
                  ? 'bg-kraatz-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Studenten
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                roleFilter === 'admin' 
                  ? 'bg-kraatz-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Ausgewählt ({selectedUsers.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 bg-kraatz-primary/10 text-kraatz-primary px-3 py-1 rounded-full text-sm"
                >
                  <span>{user.first_name} {user.last_name}</span>
                  <button
                    onClick={() => toggleUser(user)}
                    className="text-kraatz-primary/70 hover:text-kraatz-primary"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kraatz-primary"></div>
            </div>
          ) : displayedUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                {searchTerm ? 'Keine Benutzer gefunden' : 'Keine verfügbaren Chat-Partner'}
              </p>
              {searchTerm && (
                <p className="text-xs mt-1">Versuche einen anderen Suchbegriff</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayedUsers.map((chatUser: ChatUser) => {
                const isSelected = selectedUsers.some(u => u.id === chatUser.id);
                
                return (
                  <div
                    key={chatUser.id}
                    onClick={() => toggleUser(chatUser)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-kraatz-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {chatUser.first_name[0]?.toUpperCase() || 'U'}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {chatUser.first_name} {chatUser.last_name}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(chatUser.role)}`}>
                            {formatUserRole(chatUser.role)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {chatUser.email}
                        </p>
                      </div>

                      {/* Selection Indicator */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-kraatz-primary border-kraatz-primary text-white'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleCreateConversation}
              disabled={selectedUsers.length === 0 || creating}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                selectedUsers.length === 0 || creating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-kraatz-primary text-white hover:bg-kraatz-primary/90'
              }`}
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Erstelle...
                </>
              ) : (
                `Unterhaltung starten${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
