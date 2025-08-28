import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CreditCard, BookOpen, Clock, CheckCircle, Plus, ChevronDown, ChevronRight, Play, Download, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'

interface UserProfile {
  account_credits: number
  first_name: string
  last_name: string
}

interface CaseStudyRequest {
  id: string
  legal_area: string
  sub_area: string
  focus_area: string
  status: 'requested' | 'materials_ready' | 'submitted' | 'corrected'
  created_at: string
}

interface ExamSlot {
  id: number
  status: 'ausstehend' | 'sachverhalt_angefordert' | 'sachverhalt_verfuegbar' | 'klausurbearbeitung_erledigt' | 'videobesprechung_verfuegbar'
  caseStudyRequest?: CaseStudyRequest
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [caseStudies, setCaseStudies] = useState<CaseStudyRequest[]>([])
  const [examSlots, setExamSlots] = useState<ExamSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSteps, setExpandedSteps] = useState<{[key: number]: boolean}>({})

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }))
  }

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('account_credits, first_name, last_name')
        .eq('id', user?.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Fetch case studies
      const { data: caseStudyData, error: caseStudyError } = await supabase
        .from('case_study_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (caseStudyError) throw caseStudyError
      setCaseStudies(caseStudyData || [])

      // Generate exam slots based on available credits
      generateExamSlots(profileData?.account_credits || 0, caseStudyData || [])

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateExamSlots = (credits: number, requests: CaseStudyRequest[]) => {
    const slots: ExamSlot[] = []
    
    for (let i = 1; i <= credits; i++) {
      const matchingRequest = requests.find((req, index) => index + 1 === i)
      let status: ExamSlot['status'] = 'ausstehend'
      
      if (matchingRequest) {
        switch (matchingRequest.status) {
          case 'requested':
            status = 'sachverhalt_angefordert'
            break
          case 'materials_ready':
            status = 'sachverhalt_verfuegbar'
            break
          case 'submitted':
            status = 'klausurbearbeitung_erledigt'
            break
          case 'corrected':
            status = 'videobesprechung_verfuegbar'
            break
          default:
            status = 'ausstehend'
        }
      }
      
      slots.push({
        id: i,
        status,
        caseStudyRequest: matchingRequest
      })
    }
    
    setExamSlots(slots)
  }

  const getExamStatusColor = (status: ExamSlot['status']) => {
    switch (status) {
      case 'ausstehend':
        return 'bg-gray-100 text-gray-800'
      case 'sachverhalt_angefordert':
        return 'bg-yellow-100 text-yellow-800'
      case 'sachverhalt_verfuegbar':
        return 'bg-blue-100 text-blue-800'
      case 'klausurbearbeitung_erledigt':
        return 'bg-purple-100 text-purple-800'
      case 'videobesprechung_verfuegbar':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getExamStatusText = (status: ExamSlot['status']) => {
    switch (status) {
      case 'ausstehend':
        return 'Ausstehend'
      case 'sachverhalt_angefordert':
        return 'Sachverhalt angefordert'
      case 'sachverhalt_verfuegbar':
        return 'Sachverhalt verfügbar'
      case 'klausurbearbeitung_erledigt':
        return 'Klausurbearbeitung erledigt'
      case 'videobesprechung_verfuegbar':
        return 'Videobesprechung verfügbar'
      default:
        return 'Unbekannt'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800'
      case 'materials_ready':
        return 'bg-blue-100 text-blue-800'
      case 'submitted':
        return 'bg-purple-100 text-purple-800'
      case 'corrected':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'requested':
        return 'Angefordert'
      case 'materials_ready':
        return 'Bereit zum Download'
      case 'submitted':
        return 'Eingereicht'
      case 'corrected':
        return 'Korrigiert'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-box-bg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-text-primary">Willkommen zurück, {profile?.first_name}!</h1>
        <p className="text-text-secondary mb-4">
          Hier ist eine Übersicht über Deine aktuellen Sachverhalte und verfügbaren Klausuren.
        </p>
        
        {/* Expandable Steps */}
        <div className="space-y-3">
          {/* Step 1 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleStep(1)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <span className="font-medium text-text-primary">Klausur anfordern</span>
              </div>
              {expandedSteps[1] ? (
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              ) : (
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              )}
            </button>
            {expandedSteps[1] && (
              <div className="px-4 pb-4 text-sm text-text-secondary">
                Fordere im ersten Schritt Deine Klausur an, indem Du Deiner Klausur einen Themenschwerpunkt zuweist.
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleStep(2)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <span className="font-medium text-text-primary">Dozent wählt Klausur aus</span>
              </div>
              {expandedSteps[2] ? (
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              ) : (
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              )}
            </button>
            {expandedSteps[2] && (
              <div className="px-4 pb-4 text-sm text-text-secondary">
                Im Anschluss sucht Dein Dozent eine passende Klausur für Dich heraus und stellt Dir den Sachverhalt zur Verfügung.
              </div>
            )}
          </div>

          {/* Step 3 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleStep(3)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <span className="font-medium text-text-primary">Klausur bearbeiten</span>
              </div>
              {expandedSteps[3] ? (
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              ) : (
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              )}
            </button>
            {expandedSteps[3] && (
              <div className="px-4 pb-4 text-sm text-text-secondary">
                Du kannst nun mit der Bearbeitung Deiner Klausur beginnen. Lade Sie im Anschluss als PDF oder Word-Datei hoch.
              </div>
            )}
          </div>

          {/* Step 4 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleStep(4)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <span className="font-medium text-text-primary">Video-Feedback erhalten</span>
              </div>
              {expandedSteps[4] ? (
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              ) : (
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              )}
            </button>
            {expandedSteps[4] && (
              <div className="px-4 pb-4 text-sm text-text-secondary">
                Nach 48 Stunden erhältst Du Deine Klausurbesprechung als Videodatei.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-box-bg rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
              1
            </div>
            <div>
              <p className="text-sm text-text-secondary">Verfügbare Klausuren</p>
              <p className="text-2xl font-bold text-text-primary">
                {profile?.account_credits || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-box-bg rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
              2
            </div>
            <div>
              <p className="text-sm text-text-secondary">Zugewiesene Sachverhalte</p>
              <p className="text-2xl font-bold text-text-primary">
                {caseStudies.filter(cs => cs.status !== 'corrected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-box-bg rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
              3
            </div>
            <div>
              <p className="text-sm text-text-secondary">Klausurbearbeitung ausstehend</p>
              <p className="text-2xl font-bold text-text-primary">
                {caseStudies.filter(cs => cs.status === 'requested').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-box-bg rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
              4
            </div>
            <div>
              <p className="text-sm text-text-secondary">Videokorrektur abgeschlossen</p>
              <p className="text-2xl font-bold text-text-primary">
                {caseStudies.filter(cs => cs.status === 'corrected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-box-bg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Schnellaktionen
        </h2>
        <div className="flex flex-wrap gap-4">
          {profile && profile.account_credits > 0 ? (
            <Link
              to="/case-studies/request"
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              Neuen Sachverhalt anfordern
            </Link>
          ) : (
            <Link
              to="/packages"
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>weitere Klausuren buchen</span>
            </Link>
          )}
          <Link
            to="/case-studies"
            className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors"
          >
            Alle Sachverhalte anzeigen
          </Link>
        </div>
      </div>

      {/* Exam Management */}
      <div className="bg-box-bg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Deine Klausuren
        </h2>
        {examSlots.length > 0 ? (
          <div className="space-y-4">
            {examSlots.map((slot) => (
              <div
                key={slot.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {slot.id}
                    </div>
                    <h3 className="font-medium text-text-primary">
                      Klausur {slot.id}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getExamStatusColor(slot.status)}`}
                  >
                    {getExamStatusText(slot.status)}
                  </span>
                </div>

                {slot.caseStudyRequest && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-text-primary mb-1">
                      {slot.caseStudyRequest.legal_area} - {slot.caseStudyRequest.sub_area}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Schwerpunkt: {slot.caseStudyRequest.focus_area}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Angefordert: {new Date(slot.caseStudyRequest.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {slot.status === 'ausstehend' && (
                    <Link
                      to="/case-studies/request"
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Sachverhalt anfordern</span>
                    </Link>
                  )}
                  
                  {slot.status === 'sachverhalt_verfuegbar' && (
                    <>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Sachverhalt herunterladen</span>
                      </button>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Lösung einreichen</span>
                      </button>
                    </>
                  )}
                  
                  {slot.status === 'videobesprechung_verfuegbar' && (
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-2">
                      <Play className="w-4 h-4" />
                      <span>Video ansehen</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-text-secondary mb-4">
              Du hast noch keine Klausuren verfügbar.
            </p>
            <Link
              to="/packages"
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Klausuren buchen</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
