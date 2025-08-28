import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Users, Award, ArrowRight } from 'lucide-react'
import { testSupabaseConnection } from '../utils/testSupabase'

export const HomePage: React.FC = () => {
  const { user } = useAuth()

  useEffect(() => {
    // Test Supabase connection on app load
    testSupabaseConnection()
  }, [])

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-text-primary mb-6">
          Willkommen bei Deiner Video-Klausurbesprechung
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
          Perfektioniere Deine juristischen Fähigkeiten mit erprobten Sachverhalten 
          und persönlichem Video-Feedback von erfahrenen Dozenten der Akademie Kraatz.
          Einzigartig und modern: Fordere ganz einfach Deine eigene Video-Klausurbesprechung an.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          {user ? (
            <Link
              to="/dashboard"
              className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>Zum Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <span>Jetzt starten</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/packages"
                className="border border-primary text-primary px-8 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                Pakete ansehen
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-box-bg p-8 rounded-lg shadow-sm text-center">
          <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-3">
            Erprobte Sachverhalte
          </h3>
          <p className="text-text-secondary">
            Wählen aus verschiedenen Rechtsgebieten und erhalte einen passenden Sachverhalt 
            passend zu Deinen Lernzielen und Problemen.
          </p>
        </div>

        <div className="bg-box-bg p-8 rounded-lg shadow-sm text-center">
          <Users className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-3">
            Persönliches Video-Feedback
          </h3>
          <p className="text-text-secondary">
            Erhalte detailliertes Feedback von Deinem erfahrenen Dozenten 
            durch personalisierte Korrektur-Videos.
          </p>
        </div>

        <div className="bg-box-bg p-8 rounded-lg shadow-sm text-center">
          <Award className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-3">
            Flexible Pakete
          </h3>
          <p className="text-text-secondary">
            Profitiere von der einfachen Buchung und unseren Bundle-Paketen.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-box-bg rounded-lg p-8">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-8">
          So funktioniert's
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h4 className="font-semibold text-text-primary mb-2">Paket kaufen</h4>
            <p className="text-sm text-text-secondary">
              Wähle ein Paket und erhalte Klausuren für Sachverhalte
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h4 className="font-semibold text-text-primary mb-2">Sachverhalt anfordern</h4>
            <p className="text-sm text-text-secondary">
              Wähle Rechtsgebiet und Schwerpunkt für Deinen Sachverhalt
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h4 className="font-semibold text-text-primary mb-2">Lösung einreichen</h4>
            <p className="text-sm text-text-secondary">
              Bearbeite den Sachverhalt und reiche Deine Lösung ein
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h4 className="font-semibold text-text-primary mb-2">Feedback erhalten</h4>
            <p className="text-sm text-text-secondary">
              Erhalte persönliches Video-Feedback zu Deiner Lösung
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="bg-primary text-white rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bereit für den nächsten Schritt?
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Starten Sie noch heute mit Ihrem ersten Sachverhalts-Paket
          </p>
          <Link
            to="/register"
            className="bg-white text-primary px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center space-x-2 font-semibold"
          >
            <span>Kostenlos registrieren</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      )}
    </div>
  )
}
