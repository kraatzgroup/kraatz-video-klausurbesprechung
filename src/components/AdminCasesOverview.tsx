import React, { useState, useEffect } from 'react'
import { supabaseAdmin } from '../lib/supabase-admin'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Video, 
  User,
  Calendar,
  Filter,
  Search,
  Eye,
  Trash2
} from 'lucide-react'


type StatusKey = 'requested' | 'submitted' | 'in_bearbeitung' | 'corrected' | 'completed' | 'video_angefordert' | 'video_hochgeladen'

interface CaseStudyRequest {
  id: string
  user_id: string
  legal_area: string
  sub_area: string
  status: string
  created_at: string
  updated_at: string
  assigned_instructor_id?: string
  assignment_date?: string
  assignment_reason?: string
  previous_instructor_id?: string
  student?: {
    first_name: string
    last_name: string
    email: string
  }
  assigned_instructor?: {
    first_name: string
    last_name: string
    email: string
    role: string
  }
  previous_instructor?: {
    first_name: string
    last_name: string
    email: string
  }
}

const AdminCasesOverview: React.FC = () => {
  const [cases, setCases] = useState<CaseStudyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLegalArea, setSelectedLegalArea] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCase, setSelectedCase] = useState<CaseStudyRequest | null>(null)

  const legalAreas = ['Zivilrecht', 'Strafrecht', 'Öffentliches Recht']
  const statuses = [
    'requested',
    'submitted', 
    'in_bearbeitung',
    'corrected',
    'completed',
    'video_angefordert',
    'video_hochgeladen'
  ]

  const statusConfig: Record<StatusKey, {
    label: string;
    color: string;
    icon: any;
    description: string;
  }> = {
    requested: {
      label: 'Angefordert',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
      description: 'Klausur wurde angefordert'
    },
    submitted: {
      label: 'Eingereicht',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: FileText,
      description: 'Klausur wurde eingereicht, bereit zur Bearbeitung'
    },
    in_bearbeitung: {
      label: 'In Bearbeitung',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: AlertCircle,
      description: 'Dozent arbeitet an der Korrektur'
    },
    corrected: {
      label: 'Korrigiert',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      description: 'Korrektur ist fertig'
    },
    completed: {
      label: 'Abgeschlossen',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: CheckCircle,
      description: 'Fall vollständig abgeschlossen'
    },
    video_angefordert: {
      label: 'Video angefordert',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: Video,
      description: 'Video wurde angefordert'
    },
    video_hochgeladen: {
      label: 'Video hochgeladen',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: Video,
      description: 'Videokorrektur wurde hochgeladen'
    }
  }

  useEffect(() => {
    fetchAllCases()
  }, [])

  const fetchAllCases = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabaseAdmin
        .from('case_study_requests')
        .select(`
          *,
          student:user_id(first_name, last_name, email),
          assigned_instructor:assigned_instructor_id(first_name, last_name, email, role),
          previous_instructor:previous_instructor_id(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCases(data || [])
    } catch (error) {
      console.error('Error fetching cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCase = async (caseId: string, studentName: string) => {
    const confirmMessage = `Sind Sie sicher, dass Sie den Auftrag von ${studentName} löschen möchten?\n\nDies wird:\n- Den Auftrag komplett aus der Datenbank entfernen\n- Alle zugehörigen Dateien löschen\n- Den Auftrag bei Student und Dozent entfernen\n\nDiese Aktion kann nicht rückgängig gemacht werden!`
    
    if (!window.confirm(confirmMessage)) return
    
    try {
      setLoading(true)
      
      // Get the case details first to find related files
      const { data: caseData, error: fetchError } = await supabaseAdmin
        .from('case_study_requests')
        .select('*')
        .eq('id', caseId)
        .single()
      
      if (fetchError) throw fetchError
      
      // Delete related submissions first (foreign key constraint)
      const { error: submissionsError } = await supabaseAdmin
        .from('submissions')
        .delete()
        .eq('case_study_request_id', caseId)
      
      if (submissionsError) throw submissionsError
      
      // Delete related ratings
      const { error: ratingsError } = await supabaseAdmin
        .from('case_study_ratings')
        .delete()
        .eq('case_study_request_id', caseId)
      
      if (ratingsError) throw ratingsError
      
      // Delete the main case study request
      const { error: deleteError } = await supabaseAdmin
        .from('case_study_requests')
        .delete()
        .eq('id', caseId)
      
      if (deleteError) throw deleteError
      
      // Delete related files from storage if they exist
      const filesToDelete = []
      if (caseData.submission_url) filesToDelete.push(caseData.submission_url)
      if (caseData.correction_video_url) filesToDelete.push(caseData.correction_video_url)
      if (caseData.written_correction_url) filesToDelete.push(caseData.written_correction_url)
      if (caseData.solution_pdf_url) filesToDelete.push(caseData.solution_pdf_url)
      if (caseData.additional_materials_url) filesToDelete.push(caseData.additional_materials_url)
      
      // Extract file paths from URLs and delete from storage
      for (const fileUrl of filesToDelete) {
        if (fileUrl) {
          try {
            const fileName = fileUrl.split('/').pop()
            if (fileName) {
              await supabaseAdmin.storage
                .from('case-studies')
                .remove([fileName])
            }
          } catch (storageError) {
            console.warn('Error deleting file from storage:', storageError)
            // Continue with deletion even if file removal fails
          }
        }
      }
      
      // Refresh the cases list
      await fetchAllCases()
      
      alert(`Auftrag von ${studentName} wurde erfolgreich gelöscht.`)
      
    } catch (error) {
      console.error('Error deleting case:', error)
      alert('Fehler beim Löschen des Auftrags. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  const filteredCases = cases.filter(caseItem => {
    const matchesLegalArea = selectedLegalArea === 'all' || caseItem.legal_area === selectedLegalArea
    const matchesStatus = selectedStatus === 'all' || caseItem.status === selectedStatus
    const matchesSearch = searchTerm === '' || 
      (caseItem.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.student?.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.sub_area?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.assigned_instructor?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.assigned_instructor?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesLegalArea && matchesStatus && matchesSearch
  })

  const getStatusStats = (): Record<string, number> => {
    const stats: Record<string, number> = {}
    statuses.forEach(status => {
      stats[status] = cases.filter(c => c.status === status).length
    })
    return stats
  }

  const getLegalAreaStats = (): Record<string, number> => {
    const stats: Record<string, number> = {}
    legalAreas.forEach(area => {
      stats[area] = cases.filter(c => c.legal_area === area).length
    })
    return stats
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusStats = getStatusStats()
  const legalAreaStats = getLegalAreaStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Lade alle Aufträge...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          Admin Cases Overview
        </h2>
        <p className="text-gray-600">
          Zentrale Übersicht aller Klausur-Aufträge aus allen Rechtsgebieten
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cases */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gesamt</p>
              <p className="text-2xl font-semibold text-gray-900">{cases.length}</p>
            </div>
          </div>
        </div>

        {/* Legal Area Stats */}
        {legalAreas.map(area => (
          <div key={area} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {area.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{area}</p>
                <p className="text-2xl font-semibold text-gray-900">{legalAreaStats[area]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status-Verteilung</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {statuses.map(status => {
            const config = statusConfig[status as StatusKey]
            const Icon = config.icon
            return (
              <div key={status} className="text-center">
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${config.color} mb-2`}>
                  <Icon className="w-4 h-4 mr-2" />
                  {statusStats[status]}
                </div>
                <p className="text-xs text-gray-600">{config.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Legal Area Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Rechtsgebiet
            </label>
            <select
              value={selectedLegalArea}
              onChange={(e) => setSelectedLegalArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle Rechtsgebiete</option>
              {legalAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{statusConfig[status as StatusKey].label}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Suche
            </label>
            <input
              type="text"
              placeholder="Student, Dozent, Teilbereich..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Alle Aufträge ({filteredCases.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rechtsgebiet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zugewiesen an
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bearbeitet von
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erstellt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCases.map((caseItem) => {
                const config = statusConfig[caseItem.status as StatusKey]
                const Icon = config.icon
                
                return (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {caseItem.student?.first_name} {caseItem.student?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {caseItem.student?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {caseItem.legal_area}
                      </div>
                      <div className="text-sm text-gray-500">
                        {caseItem.sub_area}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                        <Icon className="w-4 h-4 mr-1" />
                        {config.label}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {caseItem.assigned_instructor ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {caseItem.assigned_instructor.first_name} {caseItem.assigned_instructor.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {caseItem.assigned_instructor.role === 'springer' ? '🔄 Springer' : '👨‍🏫 Dozent'}
                          </div>
                          {caseItem.previous_instructor && (
                            <div className="text-xs text-orange-600">
                              Übertragen von: {caseItem.previous_instructor.first_name} {caseItem.previous_instructor.last_name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Nicht zugewiesen</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {caseItem.assigned_instructor ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {caseItem.assigned_instructor.first_name} {caseItem.assigned_instructor.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {caseItem.assigned_instructor.role === 'springer' ? 'Springer-Vertretung' : 'Hauptdozent'}
                          </div>
                          {caseItem.assignment_date && (
                            <div className="text-xs text-blue-600">
                              Seit: {formatDate(caseItem.assignment_date)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm text-gray-500">Automatisch zugewiesen</span>
                          <div className="text-xs text-gray-400">
                            Basierend auf Rechtsgebiet
                          </div>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(caseItem.created_at)}
                      </div>
                      {caseItem.assignment_date && (
                        <div className="text-xs text-blue-600">
                          Zugewiesen: {formatDate(caseItem.assignment_date)}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCase(caseItem)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Details anzeigen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCase(
                            caseItem.id, 
                            `${caseItem.student?.first_name} ${caseItem.student?.last_name}`
                          )}
                          className="text-red-600 hover:text-red-900"
                          title="Auftrag löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Aufträge gefunden</h3>
            <p className="mt-1 text-sm text-gray-500">
              Mit den aktuellen Filtern wurden keine Aufträge gefunden.
            </p>
          </div>
        )}
      </div>

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Auftrag Details
              </h3>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student</label>
                  <p className="text-sm text-gray-900">
                    {selectedCase.student?.first_name} {selectedCase.student?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{selectedCase.student?.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rechtsgebiet</label>
                  <p className="text-sm text-gray-900">{selectedCase.legal_area}</p>
                  <p className="text-sm text-gray-500">{selectedCase.sub_area}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedCase.status as StatusKey].color}`}>
                  {statusConfig[selectedCase.status as StatusKey].label}
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  {statusConfig[selectedCase.status as StatusKey].description}
                </p>
              </div>
              
              {selectedCase.assigned_instructor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zugewiesen an</label>
                  <p className="text-sm text-gray-900">
                    {selectedCase.assigned_instructor.first_name} {selectedCase.assigned_instructor.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedCase.assigned_instructor.role === 'springer' ? 'Springer' : 'Dozent'} - {selectedCase.assigned_instructor.email}
                  </p>
                  {selectedCase.assignment_date && (
                    <p className="text-xs text-blue-600">
                      Zugewiesen am: {formatDate(selectedCase.assignment_date)}
                    </p>
                  )}
                  {selectedCase.assignment_reason && (
                    <p className="text-xs text-gray-600">
                      Grund: {selectedCase.assignment_reason}
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Erstellt</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedCase.created_at)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zuletzt aktualisiert</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedCase.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCasesOverview
