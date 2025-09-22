// Utility functions for handling multiple legal areas

export type LegalArea = 'Zivilrecht' | 'Strafrecht' | 'Öffentliches Recht'

export interface UserWithLegalAreas {
  legal_areas?: string[]
  instructor_legal_area?: string // Legacy field
}

/**
 * Get legal areas for a user, handling both new and legacy formats
 */
export function getUserLegalAreas(user: UserWithLegalAreas): LegalArea[] {
  // Prefer new legal_areas field
  if (user.legal_areas && user.legal_areas.length > 0) {
    return user.legal_areas as LegalArea[]
  }
  
  // Fallback to legacy instructor_legal_area
  if (user.instructor_legal_area) {
    return [user.instructor_legal_area as LegalArea]
  }
  
  return []
}

/**
 * Format legal areas for display
 */
export function formatLegalAreasDisplay(areas: LegalArea[], role: string = 'instructor'): string {
  if (areas.length === 0) return role === 'instructor' ? 'Dozent' : 'Springer'
  
  const rolePrefix = role === 'instructor' ? 'Dozent' : 'Springer'
  
  if (areas.length === 1) {
    return `${rolePrefix} ${areas[0]}`
  }
  
  if (areas.length === 3) {
    return `${rolePrefix} (Alle Gebiete)`
  }
  
  return `${rolePrefix} (${areas.join(', ')})`
}

/**
 * Check if user has access to a specific legal area
 */
export function hasAccessToLegalArea(user: UserWithLegalAreas, targetArea: LegalArea): boolean {
  const userAreas = getUserLegalAreas(user)
  return userAreas.includes(targetArea)
}

/**
 * Get all available legal areas
 */
export function getAllLegalAreas(): LegalArea[] {
  return ['Zivilrecht', 'Strafrecht', 'Öffentliches Recht']
}

/**
 * Validate legal areas array
 */
export function validateLegalAreas(areas: string[]): areas is LegalArea[] {
  const validAreas = getAllLegalAreas()
  return areas.every(area => validAreas.includes(area as LegalArea))
}

/**
 * Convert legacy single area to new array format
 */
export function migrateLegacyArea(legacyArea: string): LegalArea[] {
  if (getAllLegalAreas().includes(legacyArea as LegalArea)) {
    return [legacyArea as LegalArea]
  }
  return []
}

/**
 * Check if two users share any legal areas
 */
export function shareAnyLegalArea(user1: UserWithLegalAreas, user2: UserWithLegalAreas): boolean {
  const areas1 = getUserLegalAreas(user1)
  const areas2 = getUserLegalAreas(user2)
  
  return areas1.some(area => areas2.includes(area))
}

/**
 * Get users who can handle a specific legal area
 */
export function filterUsersByLegalArea(users: UserWithLegalAreas[], targetArea: LegalArea): UserWithLegalAreas[] {
  return users.filter(user => hasAccessToLegalArea(user, targetArea))
}
