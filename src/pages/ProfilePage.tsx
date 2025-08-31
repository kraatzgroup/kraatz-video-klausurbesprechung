import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { User, Save, AlertCircle, CheckCircle } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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
        </div>
      </div>
    </div>
  )
}
