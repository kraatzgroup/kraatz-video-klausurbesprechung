import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleBasedRoute } from './components/RoleBasedRoute'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { PackagesPage } from './pages/PackagesPage'
import { DashboardPage } from './pages/DashboardPage'
import { CaseStudiesPage } from './pages/CaseStudiesPage'
import { CaseStudyRequestPage } from './pages/CaseStudyRequestPage'
import { ResultsPage } from './pages/ResultsPage'
import InstructorDashboard from './pages/InstructorDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import AdminUserManagement from './pages/AdminUserManagement'
import AdminDashboard from './pages/AdminDashboard'
import SettingsPage from './pages/SettingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { MasterclassPage } from './pages/MasterclassPage'
import { ChatPage } from './pages/ChatPage'
import ToastTestPage from './pages/ToastTestPage'

function App() {
  try {
    const appContent = (
      <AuthProvider>
        <ToastProvider>
          <Router>
          <Layout>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['student']}>
                    <DashboardPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/case-studies"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['student']}>
                    <CaseStudiesPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/case-studies/request"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['student']}>
                    <CaseStudyRequestPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/results"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['student']}>
                    <ResultsPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/masterclass"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['student', 'admin']}>
                    <MasterclassPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor"
              element={
                <ProtectedRoute requiredRole="instructor">
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['student', 'instructor', 'springer', 'admin']}>
                    <ChatPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/toast-test"
              element={
                <ProtectedRoute>
                  <ToastTestPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
        </ToastProvider>
    </AuthProvider>
    );
    
    return appContent;
  } catch (error) {
    console.error('App Error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Anwendungsfehler</h1>
          <p className="text-gray-600 mb-4">Es ist ein Fehler aufgetreten. Bitte laden Sie die Seite neu.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }
}

export default App
