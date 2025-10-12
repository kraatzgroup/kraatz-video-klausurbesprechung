import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { supabaseAdmin } from '../lib/supabase-admin'
import { User, Save, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Password reset states
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('first_name, last_name, email, role')
            .eq('id', user.id)
            .single()
          
          if (data && !error) {
            setFirstName(data.first_name || '')
            setLastName(data.last_name || '')
            setEmail(data.email || user.email || '')
            setRole(data.role || 'student')
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setMessage({ type: 'error', text: 'Fehler beim Laden des Profils' })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserProfile()
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim()
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert!' })
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Fehler beim Speichern des Profils' })
    } finally {
      setSaving(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'instructor': return 'Dozent'
      case 'student': return 'Student'
      default: return 'Student'
    }
  }

  const validatePassword = (password: string) => {
    const minLength = password.length >= 6
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setPasswordLoading(true)
    setPasswordMessage(null)

    // Validation
    if (!newPassword) {
      setPasswordMessage({ type: 'error', text: 'Bitte geben Sie ein neues Passwort ein.' })
      setPasswordLoading(false)
      return
    }

    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      setPasswordMessage({ type: 'error', text: 'Das Passwort erfüllt nicht alle Anforderungen.' })
      setPasswordLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Die Passwörter stimmen nicht überein.' })
      setPasswordLoading(false)
      return
    }

    try {
      // Use admin client to update user password in database
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword
      })

      if (error) {
        throw error
      }

      console.log('✅ Password updated successfully for user:', user.email)
      setPasswordMessage({ type: 'success', text: 'Passwort erfolgreich geändert!' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('❌ Error updating password:', error)
      setPasswordMessage({ type: 'error', text: error.message || 'Fehler beim Ändern des Passworts' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const isAdminOrInstructor = role === 'admin' || role === 'instructor'

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-box-bg rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <User className="w-6 h-6 text-primary mr-3" />
            <h1 className="text-2xl font-bold text-text-primary">Profil bearbeiten</h1>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-md flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-2">
                  Vorname
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ihr Vorname"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-text-primary mb-2">
                  Nachname
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ihr Nachname"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                E-Mail-Adresse
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-text-secondary">
                Die E-Mail-Adresse kann nicht geändert werden.
              </p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-2">
                Rolle
              </label>
              <input
                type="text"
                id="role"
                value={getRoleDisplayName(role)}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-text-secondary">
                Die Rolle kann nur von einem Administrator geändert werden.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Speichern...' : 'Änderungen speichern'}
              </button>
            </div>
          </form>

          {/* Password Reset Section - Only for Admins and Instructors - Separate from profile form */}
          {isAdminOrInstructor && (
            <div className="bg-box-bg rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <div className="flex items-center mb-4">
                <Lock className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-text-primary">Passwort zurücksetzen</h3>
              </div>

              {passwordMessage && (
                <div className={`mb-4 p-4 rounded-md flex items-center ${
                  passwordMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {passwordMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2" />
                  )}
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
                    Neues Passwort
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Neues Passwort eingeben"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                    Neues Passwort wiederholen
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onPaste={(e) => e.preventDefault()}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Passwort wiederholen (Einfügen nicht erlaubt)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Passwort-Anforderungen:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className={`flex items-center ${validatePassword(newPassword).minLength ? 'text-green-700' : 'text-blue-700'}`}>
                      <span className="mr-2">{validatePassword(newPassword).minLength ? '✓' : '•'}</span>
                      Mindestens 6 Zeichen
                    </li>
                    <li className={`flex items-center ${validatePassword(newPassword).hasUpperCase ? 'text-green-700' : 'text-blue-700'}`}>
                      <span className="mr-2">{validatePassword(newPassword).hasUpperCase ? '✓' : '•'}</span>
                      Mind. ein Großbuchstabe
                    </li>
                    <li className={`flex items-center ${validatePassword(newPassword).hasLowerCase ? 'text-green-700' : 'text-blue-700'}`}>
                      <span className="mr-2">{validatePassword(newPassword).hasLowerCase ? '✓' : '•'}</span>
                      Min. ein Kleinbuchstabe
                    </li>
                    <li className={`flex items-center ${validatePassword(newPassword).hasNumber ? 'text-green-700' : 'text-blue-700'}`}>
                      <span className="mr-2">{validatePassword(newPassword).hasNumber ? '✓' : '•'}</span>
                      Min. eine Zahl
                    </li>
                    <li className={`flex items-center ${validatePassword(newPassword).hasSpecialChar ? 'text-green-700' : 'text-blue-700'}`}>
                      <span className="mr-2">{validatePassword(newPassword).hasSpecialChar ? '✓' : '•'}</span>
                      Mind. ein Sonderzeichen
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordLoading || !validatePassword(newPassword).isValid || newPassword !== confirmPassword}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {passwordLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    {passwordLoading ? 'Wird geändert...' : 'Passwort ändern'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
