import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { User, CreditCard, LogOut, Users, Video, Star, MessageCircle } from 'lucide-react'
import { NotificationDropdown } from '../NotificationDropdown'
import ProfileImage from '../ProfileImage'

export const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState<string>('student')
  const [userCredits, setUserCredits] = useState<number>(0)
  const [userProfile, setUserProfile] = useState<{
    first_name: string | null
    last_name: string | null
    profile_image_url: string | null
  } | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('role, account_credits, first_name, last_name, profile_image_url')
            .eq('id', user.id)
            .single()
          
          if (data && !error) {
            setUserRole(data.role || 'student')
            setUserCredits(data.account_credits || 0)
            setUserProfile({
              first_name: data.first_name,
              last_name: data.last_name,
              profile_image_url: data.profile_image_url
            })
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      }
    }

    fetchUserData()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-box-bg shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/4 Kopie (1).png" alt="Kraatz Logo" className="h-10" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                {userRole === 'admin' ? (
                  <>
                    <Link
                      to="/admin"
                      className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Users className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/masterclass"
                      className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Video className="w-4 h-4" />
                      Masterclass verwalten
                    </Link>
                    <Link
                      to="/admin?tab=ratings"
                      onClick={() => {
                        console.log('Bewertungen Dashboard Link clicked')
                      }}
                      className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Star className="w-4 h-4" />
                      Bewertungen Dashboard
                    </Link>
                    <Link
                      to="/chat"
                      className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </Link>
                  </>
                ) : userRole === 'instructor' || userRole === 'springer' ? (
                  <>
                    <Link
                      to="/instructor"
                      className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Users className="w-4 h-4" />
                      {userRole === 'springer' ? 'Springer Dashboard' : 'Instructor Dashboard'}
                    </Link>
                    <Link
                      to="/chat"
                      className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-text-secondary hover:text-primary transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/chat"
                      className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Support Chat
                    </Link>
                    <Link
                      to="/results"
                      className="text-text-secondary hover:text-primary transition-colors"
                    >
                      Ergebnisse
                    </Link>
                    <Link
                      to="/masterclass"
                      className="text-text-secondary hover:text-primary transition-colors"
                    >
                      Klausuren-Masterclass
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <NotificationDropdown />
                
                {userRole === 'student' && (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm text-text-secondary">Klausuren: {userCredits}</span>
                  </div>
                )}

                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors">
                    {/* Show profile image for instructors, springer, and admins */}
                    {(userRole === 'instructor' || userRole === 'springer' || userRole === 'admin') && userProfile?.profile_image_url ? (
                      <ProfileImage
                        imageUrl={userProfile.profile_image_url}
                        name={`${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()}
                        size="sm"
                        showBorder={false}
                      />
                    ) : (
                      <User className="w-5 h-5 text-text-secondary" />
                    )}
                    <span className="text-sm text-text-secondary">{user.email}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-box-bg rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-text-secondary hover:bg-gray-100 hover:text-primary"
                      >
                        Profil
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-text-secondary hover:bg-gray-100 hover:text-primary"
                      >
                        Einstellungen
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-gray-100 hover:text-primary flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Abmelden</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  Anmelden
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
