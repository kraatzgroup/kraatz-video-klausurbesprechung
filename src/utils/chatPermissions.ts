// Chat-Berechtigungslogik für rollenbasierte Kommunikation

export type UserRole = 'student' | 'instructor' | 'springer' | 'admin';

export interface ChatUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  profile_image_url?: string;
}

/**
 * Prüft, ob ein Benutzer mit einem anderen chatten kann (Legacy-Funktion)
 * Verwendet jetzt canParticipateInChatWith für bestehende Konversationen
 */
export const canChatWith = (currentUserRole: UserRole, targetUserRole: UserRole): boolean => {
  return canParticipateInChatWith(currentUserRole, targetUserRole);
};

/**
 * Filtert verfügbare Chat-Partner basierend auf der Benutzerrolle
 * Für neue Konversationen - Studenten können nur mit Admins neue Chats starten
 */
export const getAvailableChatPartners = (currentUser: ChatUser, allUsers: ChatUser[]): ChatUser[] => {
  return allUsers.filter(user => {
    // Nicht mit sich selbst chatten
    if (user.id === currentUser.id) return false;
    
    // Berechtigungsprüfung für neue Konversationen
    return canStartChatWith(currentUser.role, user.role);
  });
};

/**
 * Prüft, ob ein Benutzer eine neue Konversation mit einem anderen starten kann
 * Studenten können nur neue Chats mit Admins starten
 */
export const canStartChatWith = (currentUserRole: UserRole, targetUserRole: UserRole): boolean => {
  // Studenten können nur neue Chats mit Admins starten
  if (currentUserRole === 'student') {
    return targetUserRole === 'admin';
  }
  
  // Admin, Dozent und Springer können neue Chats mit ALLEN Rollen starten
  if (['admin', 'instructor', 'springer'].includes(currentUserRole)) {
    return ['admin', 'instructor', 'springer', 'student'].includes(targetUserRole);
  }
  
  return false;
};

/**
 * Prüft, ob ein Benutzer in einer bestehenden Konversation mit einem anderen chatten kann
 * (weniger restriktiv als canStartChatWith)
 */
export const canParticipateInChatWith = (currentUserRole: UserRole, targetUserRole: UserRole): boolean => {
  // Studenten können mit Admins und Dozenten chatten (wenn Konversation bereits existiert)
  if (currentUserRole === 'student') {
    return ['admin', 'instructor', 'springer'].includes(targetUserRole);
  }
  
  // Admin, Dozent und Springer können mit ALLEN Rollen chatten
  if (['admin', 'instructor', 'springer'].includes(currentUserRole)) {
    return ['admin', 'instructor', 'springer', 'student'].includes(targetUserRole);
  }
  
  return false;
};

/**
 * Bestimmt den Konversationstyp basierend auf den Teilnehmern
 */
export const getConversationType = (participants: ChatUser[]): 'support' | 'group' => {
  const hasStudent = participants.some(p => p.role === 'student');
  const hasAdmin = participants.some(p => p.role === 'admin');
  
  // Support-Chat wenn Student und Admin beteiligt sind
  if (hasStudent && hasAdmin) {
    return 'support';
  }
  
  return 'group';
};

/**
 * Generiert einen Konversationstitel basierend auf den Teilnehmern
 */
export const generateConversationTitle = (participants: ChatUser[], currentUserId: string): string => {
  const otherParticipants = participants.filter(p => p.id !== currentUserId);
  
  if (otherParticipants.length === 0) {
    return 'Leere Konversation';
  }
  
  if (otherParticipants.length === 1) {
    const other = otherParticipants[0];
    return `${other.first_name} ${other.last_name}`;
  }
  
  if (otherParticipants.length === 2) {
    return otherParticipants.map(p => `${p.first_name} ${p.last_name}`).join(', ');
  }
  
  // Für größere Gruppen
  const firstTwo = otherParticipants.slice(0, 2);
  const remaining = otherParticipants.length - 2;
  return `${firstTwo.map(p => p.first_name).join(', ')} +${remaining} weitere`;
};

/**
 * Prüft, ob ein Benutzer eine Konversation erstellen kann
 */
export const canCreateConversation = (userRole: UserRole): boolean => {
  // Alle Rollen können Konversationen erstellen
  return ['student', 'admin', 'instructor', 'springer'].includes(userRole);
};

/**
 * Prüft, ob ein Benutzer eine Nachricht löschen kann
 */
export const canDeleteMessage = (currentUserRole: UserRole, messageAuthorId: string, currentUserId: string): boolean => {
  // Admins können alle Nachrichten löschen (Moderation)
  if (currentUserRole === 'admin') {
    return true;
  }
  
  // Benutzer können ihre eigenen Nachrichten löschen
  return messageAuthorId === currentUserId;
};

/**
 * Prüft, ob ein Benutzer eine Nachricht bearbeiten kann
 */
export const canEditMessage = (messageAuthorId: string, currentUserId: string): boolean => {
  // Nur der Autor kann seine Nachricht bearbeiten
  return messageAuthorId === currentUserId;
};

/**
 * Formatiert die Benutzerrolle für die Anzeige
 */
export const formatUserRole = (role: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    student: 'Student',
    instructor: 'Dozent',
    springer: 'Springer',
    admin: 'Administrator'
  };
  
  return roleMap[role] || role;
};

/**
 * Bestimmt die Farbe für eine Benutzerrolle
 */
export const getRoleColor = (role: UserRole): string => {
  const colorMap: Record<UserRole, string> = {
    student: 'bg-blue-100 text-blue-800',
    instructor: 'bg-green-100 text-green-800',
    springer: 'bg-yellow-100 text-yellow-800',
    admin: 'bg-purple-100 text-purple-800'
  };
  
  return colorMap[role] || 'bg-gray-100 text-gray-800';
};

/**
 * Prüft, ob eine Konversation als Support-Chat klassifiziert ist
 */
export const isSupportConversation = (participants: ChatUser[]): boolean => {
  return getConversationType(participants) === 'support';
};

/**
 * Sortiert Benutzer für die Chat-Partner-Auswahl
 */
export const sortChatPartners = (users: ChatUser[]): ChatUser[] => {
  const roleOrder: Record<UserRole, number> = {
    admin: 1,
    instructor: 2,
    springer: 3,
    student: 4
  };
  
  return users.sort((a, b) => {
    // Erst nach Rolle sortieren
    const roleComparison = roleOrder[a.role] - roleOrder[b.role];
    if (roleComparison !== 0) return roleComparison;
    
    // Dann alphabetisch nach Namen
    const nameA = `${a.first_name} ${a.last_name}`;
    const nameB = `${b.first_name} ${b.last_name}`;
    return nameA.localeCompare(nameB);
  });
};
