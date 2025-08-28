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
import InstructorDashboard from './pages/InstructorDashboard'

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
              path="/instructor"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['instructor']}>
                    <InstructorDashboard />
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
