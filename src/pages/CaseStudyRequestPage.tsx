import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { getLegalAreaOptions, getSubAreaOptions } from '../data/legalAreas'
import { NotificationService } from '../services/notificationService'
import { BookOpen, CreditCard, AlertCircle } from 'lucide-react'

interface UserProfile {
  account_credits: number
  first_name: string
  last_name: string
}

export const CaseStudyRequestPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    studyPhase: '',
    legalArea: '',
    subArea: '',
    focusArea: '',
    federalState: '',
    randomAssignment: false
  })

  // German federal states (Bundesländer)
  const federalStates = [
    'Baden-Württemberg',
    'Bayern',
    'Berlin',
    'Brandenburg',
    'Bremen',
    'Hamburg',
    'Hessen',
    'Mecklenburg-Vorpommern',
    'Niedersachsen',
    'Nordrhein-Westfalen',
    'Rheinland-Pfalz',
    'Saarland',
    'Sachsen',
    'Sachsen-Anhalt',
    'Schleswig-Holstein',
    'Thüringen'
  ]

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('account_credits, first_name, last_name')
        .eq('id', user!.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setError('Fehler beim Laden des Profils')
    } finally {
      setLoading(false)
    }
  }

  const handleLegalAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLegalArea = e.target.value
    setFormData({
      studyPhase: formData.studyPhase,
      legalArea: newLegalArea,
      subArea: '',
      focusArea: '',
      federalState: '', // Reset federal state when legal area changes
      randomAssignment: formData.randomAssignment
    })
  }

  const handleSubAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      subArea: e.target.value
    })
  }

  const handleFederalStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      federalState: e.target.value
    })
  }

  const handleRandomAssignmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      randomAssignment: e.target.checked
    })
  }

  const handleFocusAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      focusArea: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile || profile.account_credits < 1) {
      setError('Du hast nicht genügend Klausuren für einen neuen Sachverhalt')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Create case study request
      const { data: caseStudyData, error: requestError } = await supabase
        .from('case_study_requests')
        .insert({
          user_id: user!.id,
          study_phase: formData.studyPhase,
          legal_area: formData.legalArea,
          sub_area: formData.randomAssignment ? null : formData.subArea,
          focus_area: formData.randomAssignment ? 'Beliebige Klausur gewünscht' : formData.focusArea,
          federal_state: formData.legalArea === 'Öffentliches Recht' && !formData.randomAssignment ? formData.federalState : null,
          status: 'requested'
        })
        .select()
        .single()

      if (requestError) throw requestError

      console.log('✅ Case study request created:', caseStudyData.id)

      // Automatically assign an available instructor for this legal area
      console.log('🎯 Finding available instructor for legal area:', formData.legalArea)
      
      const { data: availableInstructors, error: instructorError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('role', 'instructor')
        .eq('instructor_legal_area', formData.legalArea)
        .limit(1)

      if (instructorError) {
        console.error('⚠️ Error finding instructor:', instructorError)
        // Continue without assignment - admin can assign manually
      } else if (availableInstructors && availableInstructors.length > 0) {
        const assignedInstructor = availableInstructors[0]
        console.log('👨‍🏫 Assigning to instructor:', assignedInstructor.email)

        // Update the case study request with assigned instructor
        const { error: assignError } = await supabase
          .from('case_study_requests')
          .update({ 
            assigned_instructor_id: assignedInstructor.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', caseStudyData.id)

        if (assignError) {
          console.error('⚠️ Error assigning instructor:', assignError)
          // Continue - assignment can be done manually
        } else {
          console.log('✅ Successfully assigned instructor:', assignedInstructor.email)
        }
      } else {
        console.warn('⚠️ No available instructor found for legal area:', formData.legalArea)
        // Continue without assignment - admin can assign manually
      }

      // Deduct credit from user account
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          account_credits: profile.account_credits - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id)

      if (updateError) throw updateError

      // Create student notification
      const studentMessage = formData.legalArea === 'Öffentliches Recht' && formData.federalState
        ? `Ihr Sachverhalt für ${formData.legalArea} - ${formData.subArea || 'beliebiges Teilgebiet'} (${formData.federalState}) wurde erfolgreich angefordert.`
        : `Ihr Sachverhalt für ${formData.legalArea} - ${formData.subArea || 'beliebiges Teilgebiet'} wurde erfolgreich angefordert.`
      
      await NotificationService.createNotification({
        userId: user!.id,
        title: 'Sachverhalt angefordert',
        message: studentMessage,
        type: 'success',
        relatedCaseStudyId: caseStudyData.id
      })

      // Find instructor for this legal area and create instructor notification
      const { data: instructor } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('role', 'instructor')
        .eq('instructor_legal_area', formData.legalArea)
        .single()

      if (instructor) {
        await NotificationService.createInstructorNotification(
          instructor.id,
          'new_request',
          `${profile.first_name} ${profile.last_name}`,
          formData.legalArea,
          formData.subArea || 'beliebiges Teilgebiet',
          caseStudyData.id,
          formData.legalArea === 'Öffentliches Recht' ? formData.federalState : undefined
        )
      }

      navigate('/dashboard')
    } catch (error) {
      console.error('Error creating case study request:', error)
      setError('Fehler beim Erstellen der Anfrage. Bitte versuche es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile || profile.account_credits < 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-box-bg rounded-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Keine Klausuren verfügbar
          </h1>
          <p className="text-text-secondary mb-6">
            Du benötigst mindestens eine Klausur, um einen neuen Sachverhalt anzufordern.
          </p>
          <button
            onClick={() => navigate('/packages')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <CreditCard className="w-5 h-5" />
            <span>weitere Klausuren buchen</span>
          </button>
        </div>
      </div>
    )
  }

  const legalAreaOptions = getLegalAreaOptions()
  const subAreaOptions = formData.legalArea ? getSubAreaOptions(formData.legalArea) : []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-box-bg rounded-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <BookOpen className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Neuen Sachverhalt anfordern
            </h1>
            <p className="text-text-secondary">
              Verfügbare Credits: {profile.account_credits}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="studyPhase" className="block text-sm font-medium text-text-secondary mb-2">
              In welcher Phase des Studiums befindest Du Dich? *
            </label>
            <select
              id="studyPhase"
              value={formData.studyPhase}
              onChange={(e) => setFormData({...formData, studyPhase: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Bitte wähle Deine Studienphase</option>
              <option value="Grund- und Hauptstudium">Grund- und Hauptstudium</option>
              <option value="1. Examensvorbereitung">1. Examensvorbereitung</option>
            </select>
          </div>

          <div>
            <label htmlFor="legalArea" className="block text-sm font-medium text-text-secondary mb-2">
              Rechtsgebiet *
            </label>
            <select
              id="legalArea"
              value={formData.legalArea}
              onChange={handleLegalAreaChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Bitte wähle ein Rechtsgebiet</option>
              {legalAreaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Federal State Dropdown - only show for "Öffentliches Recht" */}
          {formData.legalArea === 'Öffentliches Recht' && (
            <div>
              <label htmlFor="federalState" className="block text-sm font-medium text-text-secondary mb-2">
                Bundesland *
              </label>
              <select
                id="federalState"
                value={formData.federalState}
                onChange={handleFederalStateChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                required={formData.legalArea === 'Öffentliches Recht' && !formData.randomAssignment}
                disabled={formData.randomAssignment}
              >
                <option value="">Bitte wähle Dein Bundesland</option>
                {federalStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-secondary mt-1">
                Das Bundesland ist wichtig für landesspezifische Regelungen im öffentlichen Recht.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="subArea" className="block text-sm font-medium text-text-secondary mb-2">
              Teilrechtsgebiet *
            </label>
            <select
              id="subArea"
              value={formData.subArea}
              onChange={handleSubAreaChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required={!formData.randomAssignment}
              disabled={!formData.legalArea || formData.randomAssignment}
            >
              <option value="">
                {formData.legalArea ? 'Bitte wähle ein Teilrechtsgebiet' : 'Zuerst Rechtsgebiet wählen'}
              </option>
              {subAreaOptions.map((subArea) => (
                <option key={subArea} value={subArea}>
                  {subArea}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="focusArea" className="block text-sm font-medium text-text-secondary mb-2">
              Schwerpunkt / Spezifische Anforderungen
            </label>
            <textarea
              id="focusArea"
              value={formData.focusArea}
              onChange={handleFocusAreaChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Gebe einen Schwerpunkt pro Klausur an, bspw.: Vertreter ohne Vertretungsmacht"
              required={!formData.randomAssignment}
              disabled={formData.randomAssignment}
            />
            <p className="text-xs text-text-secondary mt-1">
              Bitte beachte, dass wir nur einen Wunschschwerpunkt berücksichtigen können.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="randomAssignment"
              checked={formData.randomAssignment}
              onChange={handleRandomAssignmentChange}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="randomAssignment" className="text-sm text-text-secondary">
              Mein Dozent soll mir eine beliebige Klausur zuweisen
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
            <p className="font-medium mb-1">Was passiert als nächstes?</p>
            <ul className="text-xs space-y-1">
              <li>• Dein Dozent wählt eine passende Klausur für Dich aus</li>
              <li>• Du erhältst eine Benachrichtigung, sobald der Sachverhalt zum Download bereit ist</li>
              <li>• Nach der Klausurbearbeitung kannst Du Deine Lösung hochladen und erhältst Dein Video-Feedback</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 border border-gray-300 text-text-secondary px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={
                submitting || 
                !formData.studyPhase || 
                !formData.legalArea || 
                (formData.legalArea === 'Öffentliches Recht' && !formData.randomAssignment && !formData.federalState) ||
                (!formData.randomAssignment && (!formData.subArea || !formData.focusArea))
              }
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Wird angefordert...' : 'Sachverhalt anfordern (1 Klausur)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
