import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { BookOpen, Download, Upload, Play, Plus, Filter } from 'lucide-react'

interface CaseStudyRequest {
  id: string
  legal_area: string
  sub_area: string
  focus_area: string
  status: 'requested' | 'materials_ready' | 'submitted' | 'corrected'
  pdf_url: string | null
  created_at: string
  updated_at: string
}

interface Submission {
  id: string
  case_study_request_id: string
  file_url: string
  file_type: 'pdf' | 'docx'
  status: 'submitted' | 'under_review' | 'corrected'
  correction_video_url: string | null
  landing_page_url: string | null
  submitted_at: string
  corrected_at: string | null
}

export const CaseStudiesPage: React.FC = () => {
  const { user } = useAuth()
  const [caseStudies, setCaseStudies] = useState<CaseStudyRequest[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (user) {
      fetchCaseStudies()
      fetchSubmissions()
    }
  }, [user])

  const fetchCaseStudies = async () => {
    try {
      const { data, error } = await supabase
        .from('case_study_requests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCaseStudies(data || [])
    } catch (error) {
      console.error('Error fetching case studies:', error)
    }
  }

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          case_study_requests!inner(user_id)
        `)
        .eq('case_study_requests.user_id', user!.id)

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
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
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSubmissionForCaseStudy = (caseStudyId: string) => {
    return submissions.find(sub => sub.case_study_request_id === caseStudyId)
  }

  const filteredCaseStudies = caseStudies.filter(cs => {
    if (filter === 'all') return true
    return cs.status === filter
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Meine Sachverhalte</h1>
        <Link
          to="/case-studies/request"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Neuer Sachverhalt</span>
        </Link>
      </div>

      {/* Filter */}
      <div className="bg-box-bg rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-text-secondary" />
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              Alle ({caseStudies.length})
            </button>
            <button
              onClick={() => setFilter('requested')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'requested'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              Angefordert ({caseStudies.filter(cs => cs.status === 'requested').length})
            </button>
            <button
              onClick={() => setFilter('materials_ready')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'materials_ready'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              Bereit ({caseStudies.filter(cs => cs.status === 'materials_ready').length})
            </button>
            <button
              onClick={() => setFilter('submitted')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'submitted'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              Eingereicht ({caseStudies.filter(cs => cs.status === 'submitted').length})
            </button>
            <button
              onClick={() => setFilter('corrected')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'corrected'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              Korrigiert ({caseStudies.filter(cs => cs.status === 'corrected').length})
            </button>
          </div>
        </div>
      </div>

      {/* Case Studies List */}
      {filteredCaseStudies.length === 0 ? (
        <div className="bg-box-bg rounded-lg p-8 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {filter === 'all' ? 'Keine Sachverhalte gefunden' : `Keine ${getStatusText(filter).toLowerCase()}en Sachverhalte`}
          </h3>
          <p className="text-text-secondary mb-4">
            {filter === 'all' 
              ? 'Sie haben noch keine Sachverhalte angefordert.'
              : `Sie haben keine Sachverhalte mit dem Status "${getStatusText(filter)}".`
            }
          </p>
          <Link
            to="/case-studies/request"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ersten Sachverhalt anfordern
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCaseStudies.map((caseStudy) => {
            const submission = getSubmissionForCaseStudy(caseStudy.id)
            
            return (
              <div key={caseStudy.id} className="bg-box-bg rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      {caseStudy.legal_area} - {caseStudy.sub_area}
                    </h3>
                    <p className="text-text-secondary mb-2">
                      {caseStudy.focus_area}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-text-secondary">
                      <span>Angefordert: {formatDate(caseStudy.created_at)}</span>
                      {caseStudy.updated_at !== caseStudy.created_at && (
                        <span>Aktualisiert: {formatDate(caseStudy.updated_at)}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      caseStudy.status
                    )}`}
                  >
                    {getStatusText(caseStudy.status)}
                  </span>
                </div>

                <div className="flex space-x-3">
                  {caseStudy.status === 'materials_ready' && caseStudy.pdf_url && (
                    <a
                      href={caseStudy.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Sachverhalt herunterladen</span>
                    </a>
                  )}

                  {caseStudy.status === 'materials_ready' && !submission && (
                    <Link
                      to={`/case-studies/${caseStudy.id}/submit`}
                      className="border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Lösung einreichen</span>
                    </Link>
                  )}

                  {submission && submission.status === 'corrected' && submission.landing_page_url && (
                    <a
                      href={submission.landing_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Video-Korrektur ansehen</span>
                    </a>
                  )}

                  {submission && submission.status !== 'corrected' && (
                    <div className="text-sm text-text-secondary flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>
                        Eingereicht am {formatDate(submission.submitted_at)} - 
                        {submission.status === 'submitted' ? ' Wartet auf Korrektur' : ' Wird korrigiert'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
