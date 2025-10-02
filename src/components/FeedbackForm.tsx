import React, { useState } from 'react'
import { X, FileText, Calendar, Lightbulb, Target, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { downloadFeedbackPDF } from '../utils/pdfGenerator'

interface FeedbackFormProps {
  isOpen: boolean
  onClose: () => void
  caseStudyId: string
  caseStudyTitle: string
  existingFeedback?: StudentFeedback | null
  caseStudyInfo?: {
    legal_area: string
    sub_area: string
    focus_area: string
    case_study_number: number
  }
  userInfo?: {
    first_name: string
    last_name: string
  }
}

interface StudentFeedback {
  id: string
  case_study_id: string
  user_id: string
  mistakes_learned: string
  improvements_planned: string
  review_date: string
  email_reminder: boolean
  reminder_sent: boolean
  created_at: string
  updated_at: string
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  isOpen,
  onClose,
  caseStudyId,
  caseStudyTitle,
  existingFeedback,
  caseStudyInfo,
  userInfo
}) => {
  const [mistakesLearned, setMistakesLearned] = useState(existingFeedback?.mistakes_learned || '')
  const [improvementsPlanned, setImprovementsPlanned] = useState(existingFeedback?.improvements_planned || '')
  const [reviewDate, setReviewDate] = useState(existingFeedback?.review_date || '')
  const [emailReminder, setEmailReminder] = useState(existingFeedback?.email_reminder || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDownloadPDF = () => {
    if (!existingFeedback || !caseStudyInfo || !userInfo) {
      alert('PDF kann nur für gespeicherte Feedbacks erstellt werden.')
      return
    }

    try {
      console.log('🔄 Starting PDF download from FeedbackForm...', {
        existingFeedback,
        caseStudyInfo,
        userInfo
      })
      downloadFeedbackPDF(existingFeedback, caseStudyInfo, userInfo)
    } catch (error) {
      console.error('❌ Error in handleDownloadPDF:', error)
      alert('Fehler beim PDF-Download. Bitte versuchen Sie es erneut.')
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!mistakesLearned.trim() || !improvementsPlanned.trim() || !reviewDate) {
      alert('Bitte fülle alle Felder aus.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Benutzer nicht authentifiziert')
      }

      const feedbackData = {
        case_study_id: caseStudyId,
        user_id: user.id,
        mistakes_learned: mistakesLearned.trim(),
        improvements_planned: improvementsPlanned.trim(),
        review_date: reviewDate,
        email_reminder: emailReminder
      }

      let error
      
      if (existingFeedback) {
        // Update existing feedback
        const { error: updateError } = await supabase
          .from('student_feedback')
          .update({
            ...feedbackData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFeedback.id)
        
        error = updateError
      } else {
        // Create new feedback
        const { error: insertError } = await supabase
          .from('student_feedback')
          .insert(feedbackData)
        
        error = insertError
      }

      if (error) {
        throw error
      }

      alert('Feedbackpapier erfolgreich gespeichert!')
      onClose()
      
    } catch (error) {
      console.error('Error saving feedback:', error)
      alert('Fehler beim Speichern des Feedbackpapiers: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Feedbackpapier</h3>
              <p className="text-sm text-gray-600">{caseStudyTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Nutze dieses Feedbackpapier</strong> zur Reflexion deiner Klausurkorrektur. 
              Es hilft dir dabei, aus Fehlern zu lernen und deine Leistung kontinuierlich zu verbessern.
            </p>
          </div>

          {/* Selbsterkenntnis: Was habe ich falsch gemacht */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Selbsterkenntnis: Was habe ich falsch gemacht und kann ich aus der Korrektur mitnehmen?
            </label>
            <textarea
              value={mistakesLearned}
              onChange={(e) => setMistakesLearned(e.target.value)}
              placeholder="Beschreibe hier, welche Fehler du gemacht hast und was du aus der Korrektur gelernt hast..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={5}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Beispiel: "Ich habe die Anspruchsgrundlage nicht vollständig geprüft und wichtige Tatbestandsmerkmale übersehen..."
            </p>
          </div>

          {/* Selbsterkenntnis: Was möchte ich künftig besser machen */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Target className="w-4 h-4 text-green-500" />
              Selbsterkenntnis: Was möchte ich künftig besser machen?
            </label>
            <textarea
              value={improvementsPlanned}
              onChange={(e) => setImprovementsPlanned(e.target.value)}
              placeholder="Beschreibe hier konkrete Verbesserungsmaßnahmen für zukünftige Klausuren..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={5}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Beispiel: "Ich werde in Zukunft systematischer vorgehen und eine Checkliste für die Anspruchsprüfung verwenden..."
            </p>
          </div>

          {/* Datum für Wiederholung */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-4 h-4 text-purple-500" />
              Datum eintragen: Wann möchte ich die Inhalte wiederholen?
            </label>
            <input
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Plane einen konkreten Termin für die Wiederholung der Lerninhalte ein.
            </p>
            
            {/* E-Mail-Benachrichtigung Checkbox */}
            <div className="mt-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={emailReminder}
                  onChange={(e) => setEmailReminder(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span>📧 E-Mail-Erinnerung am Wiederholungstermin senden</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Du erhältst eine E-Mail-Benachrichtigung am ausgewählten Datum zur Wiederholung der Lerninhalte.
              </p>
            </div>
          </div>

          {/* PDF Download Button - Only show for existing feedback */}
          {existingFeedback && caseStudyInfo && userInfo && (
            <div className="pt-4 border-t">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Feedbackpapier als PDF herunterladen
              </button>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  {existingFeedback ? 'Feedbackpapier aktualisieren' : 'Feedbackpapier speichern'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
