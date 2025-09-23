import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
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

function App() {
  return (
    <AuthProvider>
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
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
