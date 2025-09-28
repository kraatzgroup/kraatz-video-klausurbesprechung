import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TrendingUp, Award, BarChart3, BookOpen, CheckCircle, Play, TrendingDown } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface SubmissionResult {
  id: string
  case_study_request_id: string
  grade: number
  grade_text: string
  legal_area: string
  sub_area: string
  focus_area: string
  corrected_at: string
  created_at: string
  submitted_at: string
  correction_video_url: string
}

interface LegalAreaStats {
  area: string
  average_grade: number
  total_submissions: number
  trend: 'up' | 'down' | 'stable'
  latest_grade: number
  previous_grade: number
}

export const ResultsPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [results, setResults] = useState<SubmissionResult[]>([])
  const [legalAreaStats, setLegalAreaStats] = useState<LegalAreaStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0)
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchResults()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          grade,
          grade_text,
          corrected_at,
          submitted_at,
          correction_video_url,
          case_study_request_id,
          case_study_requests!inner (
            legal_area,
            sub_area,
            focus_area,
            created_at,
            user_id
          )
        `)
        .eq('case_study_requests.user_id', user!.id)
        .eq('status', 'corrected')
        .not('grade', 'is', null)
        .order('corrected_at', { ascending: false })

      if (error) throw error

      const formattedResults: SubmissionResult[] = data.map((item: any) => ({
        id: item.id,
        case_study_request_id: item.case_study_request_id,
        grade: item.grade,
        grade_text: item.grade_text,
        legal_area: (item as any).case_study_requests.legal_area,
        sub_area: (item as any).case_study_requests.sub_area,
        focus_area: (item as any).case_study_requests.focus_area,
        corrected_at: item.corrected_at,
        submitted_at: item.submitted_at,
        correction_video_url: item.correction_video_url,
        created_at: (item as any).case_study_requests.created_at
      }))

      setResults(formattedResults)
      calculateStatistics(formattedResults)
      prepareChartData(formattedResults)
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (results: SubmissionResult[]) => {
    if (results.length === 0) return

    // Overall statistics
    setTotalSubmissions(results.length)

    // Group by legal area
    const areaGroups = results.reduce((groups, result) => {
      const area = result.legal_area
      if (!groups[area]) {
        groups[area] = []
      }
      groups[area].push(result)
      return groups
    }, {} as Record<string, SubmissionResult[]>)

    // Calculate statistics for each legal area
    const areaStats: LegalAreaStats[] = Object.entries(areaGroups).map(([area, areaResults]) => {
      const sortedResults = areaResults.sort((a, b) => 
        new Date(b.corrected_at).getTime() - new Date(a.corrected_at).getTime()
      )
      
      const totalGrade = areaResults.reduce((sum, result) => sum + result.grade, 0)
      const averageGrade = totalGrade / areaResults.length
      
      const latestGrade = sortedResults[0]?.grade || 0
      const previousGrade = sortedResults[1]?.grade || latestGrade
      
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (sortedResults.length > 1) {
        if (latestGrade > previousGrade) trend = 'up'
        else if (latestGrade < previousGrade) trend = 'down'
      }

      return {
        area,
        average_grade: averageGrade,
        total_submissions: areaResults.length,
        trend,
        latest_grade: latestGrade,
        previous_grade: previousGrade
      }
    })

    setLegalAreaStats(areaStats.sort((a, b) => b.total_submissions - a.total_submissions))
  }

  const prepareChartData = (results: SubmissionResult[]) => {
    // Sort results by correction date
    const sortedResults = [...results].sort((a, b) => 
      new Date(a.corrected_at).getTime() - new Date(b.corrected_at).getTime()
    )

    // Create chart data with cumulative averages and per legal area
    const chartPoints = sortedResults.map((result, index) => {
      const resultsUpToNow = sortedResults.slice(0, index + 1)
      const overallAvg = resultsUpToNow.reduce((sum, r) => sum + r.grade, 0) / resultsUpToNow.length

      // Calculate averages per legal area up to this point
      const areaAverages: Record<string, number> = {}
      const areaCounts: Record<string, number> = {}
      
      resultsUpToNow.forEach(r => {
        if (!areaAverages[r.legal_area]) {
          areaAverages[r.legal_area] = 0
          areaCounts[r.legal_area] = 0
        }
        areaAverages[r.legal_area] += r.grade
        areaCounts[r.legal_area] += 1
      })

      Object.keys(areaAverages).forEach(area => {
        areaAverages[area] = areaAverages[area] / areaCounts[area]
      })

      return {
        date: formatDate(result.corrected_at),
        overall: parseFloat(overallAvg.toFixed(2)),
        Zivilrecht: areaAverages['Zivilrecht'] ? parseFloat(areaAverages['Zivilrecht'].toFixed(2)) : null,
        Strafrecht: areaAverages['Strafrecht'] ? parseFloat(areaAverages['Strafrecht'].toFixed(2)) : null,
        'Öffentliches Recht': areaAverages['Öffentliches Recht'] ? parseFloat(areaAverages['Öffentliches Recht'].toFixed(2)) : null
      }
    })

    setChartData(chartPoints)
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 9) return 'text-green-600'
    if (grade >= 7) return 'text-yellow-600'
    if (grade >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGradeBadgeColor = (grade: number) => {
    if (grade >= 9) return 'bg-green-100 text-green-800'
    if (grade >= 7) return 'bg-yellow-100 text-yellow-800'
    if (grade >= 4) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const formatGrade = (grade: number) => {
    return grade.toFixed(2).replace('.', ',')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const navigateToVideoInDashboard = (caseStudyRequestId: string) => {
    // Navigate to dashboard with the case study ID as a hash parameter
    navigate(`/dashboard#case-study-${caseStudyRequestId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show "no results" message only when there are truly no results
  // As soon as there is 1+ result, show the full professional layout
  if (results.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-box-bg rounded-lg p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Noch keine Ergebnisse
          </h1>
          <p className="text-text-secondary">
            Sobald Du Deine ersten Klausuren korrigiert bekommst, siehst Du hier Deine Ergebnisse und Statistiken.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Meine Klausurergebnisse
        </h1>
        <p className="text-text-secondary">
          Verfolge Deinen Fortschritt und analysiere Deine Leistung nach Rechtsgebieten
        </p>
      </div>

      {/* Performance Overview - Deine Ergebnisse */}
      <div className="bg-box-bg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          Deine Ergebnisse
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-primary mr-2" />
              <span className="text-sm text-text-secondary">Korrigierte Klausuren</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{totalSubmissions}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-sm text-text-secondary">Durchschnittliches Ergebnis Zivilrecht</span>
            </div>
            <p className={`text-2xl font-bold ${getGradeColor(legalAreaStats.find(s => s.area === 'Zivilrecht')?.average_grade || 0)}`}>
              {legalAreaStats.find(s => s.area === 'Zivilrecht') 
                ? formatGrade(legalAreaStats.find(s => s.area === 'Zivilrecht')!.average_grade) + ' Punkte'
                : 'Keine Daten'
              }
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-green-600 mr-2" />
              <span className="text-sm text-text-secondary">Durchschnittliches Ergebnis Öffentliches Recht</span>
            </div>
            <p className={`text-2xl font-bold ${getGradeColor(legalAreaStats.find(s => s.area === 'Öffentliches Recht')?.average_grade || 0)}`}>
              {legalAreaStats.find(s => s.area === 'Öffentliches Recht') 
                ? formatGrade(legalAreaStats.find(s => s.area === 'Öffentliches Recht')!.average_grade) + ' Punkte'
                : 'Keine Daten'
              }
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-red-600 mr-2" />
              <span className="text-sm text-text-secondary">Durchschnittliches Ergebnis Strafrecht</span>
            </div>
            <p className={`text-2xl font-bold ${getGradeColor(legalAreaStats.find(s => s.area === 'Strafrecht')?.average_grade || 0)}`}>
              {legalAreaStats.find(s => s.area === 'Strafrecht') 
                ? formatGrade(legalAreaStats.find(s => s.area === 'Strafrecht')!.average_grade) + ' Punkte'
                : 'Keine Daten'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <div className="bg-box-bg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Verlauf Deiner Leistung
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  domain={[0, 18]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Punkte', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    value ? `${value.toString().replace('.', ',')} Punkte` : 'Keine Daten', 
                    name
                  ]}
                  labelFormatter={(label: string) => `Datum: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Zivilrecht" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Strafrecht" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Öffentliches Recht" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Individual Exam Cards - Deine Klausuren */}
      <div className="bg-box-bg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          Deine Klausuren
        </h2>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={result.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary text-lg">
                      Klausur {index + 1}
                    </h3>
                    <p className="text-text-primary font-medium">
                      {result.legal_area} - {result.sub_area}
                    </p>
                    <p className="text-sm text-text-secondary">
                      Schwerpunkt: {result.focus_area}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Angefordert: {formatDate(result.submitted_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Videobesprechung verfügbar</span>
                  </div>
                  <button 
                    onClick={() => navigateToVideoInDashboard(result.case_study_request_id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Video ansehen</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Area Statistics */}
      <div className="bg-box-bg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          Statistik nach Rechtsgebieten
        </h2>
        <div className="space-y-4">
          {legalAreaStats.map((stat) => (
            <div key={stat.area} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-text-primary">{stat.area}</h3>
                <div className="flex items-center space-x-2">
                  {stat.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
                  {stat.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
                  {stat.trend === 'stable' && <div className="w-5 h-5" />}
                  <span className={`text-sm ${getGradeColor(stat.average_grade)}`}>
                    ⌀ {formatGrade(stat.average_grade)} Punkte
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary">Klausuren</p>
                  <p className="font-medium">{stat.total_submissions}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Letzte Note</p>
                  <p className={`font-medium ${getGradeColor(stat.latest_grade)}`}>
                    {formatGrade(stat.latest_grade)}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Tendenz</p>
                  <p className={`font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.trend === 'up' ? 'Verbesserung' : 
                     stat.trend === 'down' ? 'Verschlechterung' : 'Stabil'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Results */}
      <div className="bg-box-bg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          Aktuelle Ergebnisse
        </h2>
        <div className="space-y-4">
          {results.slice(0, 10).map((result) => (
            <div key={result.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-text-primary">
                      {result.legal_area} - {result.sub_area}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeBadgeColor(result.grade)}`}>
                      {formatGrade(result.grade)} Punkte
                    </span>
                  </div>
                  {result.grade_text && (
                    <p className="text-sm text-text-secondary mb-2">{result.grade_text}</p>
                  )}
                  <p className="text-xs text-text-secondary">
                    Korrigiert am {formatDate(result.corrected_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
