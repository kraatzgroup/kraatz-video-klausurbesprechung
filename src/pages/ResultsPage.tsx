import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {Award,BarChart3, BookOpen,Play, TrendingDown } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface SubmissionResult {
  id: string
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
      const {error } = await supabase
        .from('submissions')
        .select(`
          id,
          grade,
          grade_text,
          corrected_at,
          submitted_at,
          correction_video_url,
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

      const formattedResults: SubmissionResult[] = data.map(item => ({
        id: item.id,
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
    const totalGrades = results.reduce((sum, result) => sum + result.grade, 0)