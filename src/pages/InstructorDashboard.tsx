import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Upload,
  Eye
} from 'lucide-react';

interface CaseStudyRequest {
  id: string;
  title: string;
  legal_area: string;
  sub_area: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Submission {
  id: string;
  case_study_request_id: string;
  file_path: string;
  submitted_at: string;
  feedback_video_path?: string;
  status: 'submitted' | 'reviewed';
  case_study_request: {
    title: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'submissions'>('requests');
  const [requests, setRequests] = useState<CaseStudyRequest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch case study requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('case_study_requests')
        .select(`
          *,
          user:users(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          case_study_request:case_study_requests(
            title,
            user:users(first_name, last_name, email)
          )
        `)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('case_study_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status } : req
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      submitted: 'bg-purple-100 text-purple-800',
      reviewed: 'bg-green-100 text-green-800'
    };

    const icons = {
      pending: <Clock className="w-3 h-3" />,
      in_progress: <AlertCircle className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      submitted: <FileText className="w-3 h-3" />,
      reviewed: <CheckCircle className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const stats = {
    totalRequests: requests.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    inProgressRequests: requests.filter(r => r.status === 'in_progress').length,
    completedRequests: requests.filter(r => r.status === 'completed').length,
    totalSubmissions: submissions.length,
    pendingReviews: submissions.filter(s => s.status === 'submitted').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kraatz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage case study requests and student submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-kraatz-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'requests'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Case Study Requests ({stats.totalRequests})
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'submissions'
                    ? 'border-kraatz-primary text-kraatz-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Student Submissions ({stats.totalSubmissions})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'requests' ? (
              <div className="space-y-4">
                {requests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No case study requests yet.</p>
                ) : (
                  requests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {request.user.first_name} {request.user.last_name} ({request.user.email})
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-500">{request.legal_area}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{request.sub_area}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-2">{request.description}</p>
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-2">
                          {getStatusBadge(request.status)}
                          <div className="flex gap-2">
                            <select
                              value={request.status}
                              onChange={(e) => updateRequestStatus(request.id, e.target.value as any)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No student submissions yet.</p>
                ) : (
                  submissions.map((submission) => (
                    <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {submission.case_study_request.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {submission.case_study_request.user.first_name} {submission.case_study_request.user.last_name} 
                            ({submission.case_study_request.user.email})
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Submitted: {new Date(submission.submitted_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-2">
                          {getStatusBadge(submission.status)}
                          <div className="flex gap-2">
                            <button className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                            <button className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
                              <Upload className="w-3 h-3" />
                              Upload Video
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
