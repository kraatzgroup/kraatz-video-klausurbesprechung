import { supabase } from '../lib/supabase'

export interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  relatedCaseStudyId?: string
}

export class NotificationService {
  static async createNotification(params: CreateNotificationParams) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          related_case_study_id: params.relatedCaseStudyId,
          read: false
        })

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error creating notification:', error)
      return { success: false, error }
    }
  }

  static async createCaseStudyStatusNotification(
    userId: string,
    status: string,
    legalArea: string,
    subArea: string,
    caseStudyId: string
  ) {
    let title = ''
    let message = ''
    let type: 'info' | 'success' | 'warning' | 'error' = 'info'

    switch (status) {
      case 'materials_ready':
        title = '📚 Sachverhalt verfügbar'
        message = `Ihr Sachverhalt für ${legalArea} - ${subArea} ist jetzt verfügbar und kann bearbeitet werden.`
        type = 'success'
        break
      
      case 'submitted':
        title = '✅ Bearbeitung eingereicht'
        message = `Ihre Bearbeitung für ${legalArea} - ${subArea} wurde erfolgreich eingereicht. Die Korrektur erfolgt in 48 Stunden.`
        type = 'success'
        break
      
      case 'under_review':
        title = '👨‍🏫 Korrektur in Bearbeitung'
        message = `Ihr Dozent bearbeitet gerade die Korrektur für ${legalArea} - ${subArea}.`
        type = 'info'
        break
      
      case 'corrected':
        title = '🎓 Korrektur verfügbar'
        message = `Die Korrektur für ${legalArea} - ${subArea} ist verfügbar. Schauen Sie sich das Video und die schriftliche Bewertung an.`
        type = 'success'
        break
      
      case 'completed':
        title = '🎉 Klausur abgeschlossen'
        message = `Die Klausur ${legalArea} - ${subArea} wurde erfolgreich abgeschlossen.`
        type = 'success'
        break
      
      default:
        return { success: false, error: 'Unknown status' }
    }

    return this.createNotification({
      userId,
      title,
      message,
      type,
      relatedCaseStudyId: caseStudyId
    })
  }

  static async createInstructorNotification(
    instructorId: string,
    action: string,
    studentName: string,
    legalArea: string,
    subArea: string,
    caseStudyId: string,
    federalState?: string
  ) {
    let title = ''
    let message = ''
    let type: 'info' | 'success' | 'warning' | 'error' = 'info'

    switch (action) {
      case 'new_request':
        title = '📝 Neue Sachverhalt-Anfrage'
        if (legalArea === 'Öffentliches Recht' && federalState) {
          message = `${studentName} hat einen Sachverhalt für ${legalArea} - ${subArea} (${federalState}) angefordert.`
        } else {
          message = `${studentName} hat einen Sachverhalt für ${legalArea} - ${subArea} angefordert.`
        }
        type = 'info'
        break
      
      case 'submission_received':
        title = '📄 Neue Bearbeitung eingereicht'
        if (legalArea === 'Öffentliches Recht' && federalState) {
          message = `${studentName} hat eine Bearbeitung für ${legalArea} - ${subArea} (${federalState}) eingereicht.`
        } else {
          message = `${studentName} hat eine Bearbeitung für ${legalArea} - ${subArea} eingereicht.`
        }
        type = 'info'
        break
      
      default:
        return { success: false, error: 'Unknown action' }
    }

    return this.createNotification({
      userId: instructorId,
      title,
      message,
      type,
      relatedCaseStudyId: caseStudyId
    })
  }

  static async createChatNotification(
    recipientId: string,
    senderName: string,
    messageContent: string,
    conversationId?: string
  ) {
    const title = '💬 Neue Chat-Nachricht'
    const message = `${senderName}: ${messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent}`
    
    return this.createNotification({
      userId: recipientId,
      title,
      message,
      type: 'info',
      relatedCaseStudyId: conversationId // We'll use this field to store conversation ID for chat notifications
    })
  }

  static async createAdminNotification(
    adminId: string,
    action: string,
    details: string
  ) {
    let title = ''
    let message = ''
    let type: 'info' | 'success' | 'warning' | 'error' = 'info'

    switch (action) {
      case 'new_user_registered':
        title = '👤 Neuer Benutzer registriert'
        message = `Ein neuer Benutzer hat sich registriert: ${details}`
        type = 'info'
        break
      
      case 'system_alert':
        title = '⚠️ System-Benachrichtigung'
        message = details
        type = 'warning'
        break
      
      default:
        title = '📢 Admin-Benachrichtigung'
        message = details
        type = 'info'
    }

    return this.createNotification({
      userId: adminId,
      title,
      message,
      type
    })
  }

  static async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error }
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return { success: false, error }
    }
  }

  static async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting notification:', error)
      return { success: false, error }
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }
}
