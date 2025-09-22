import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Check, CreditCard, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Package {
  id: string
  name: string
  description: string
  case_study_count: number
  price_euros: number
  popular?: boolean
}

export const PackagesPage: React.FC = () => {
  const { user } = useAuth()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  
  const packages: Package[] = [
    {
      id: '5er',
      name: '5er Paket',
      description: 'Perfekt für den Einstieg',
      case_study_count: 5,
      price_euros: 675
    },
    {
      id: '10er',
      name: '10er Paket',
      description: 'Ideal für regelmäßiges Üben',
      case_study_count: 10,
      price_euros: 1250,
      popular: true
    },
    {
      id: '15er',
      name: '15er Paket',
      description: 'Für intensive Vorbereitung',
      case_study_count: 15,
      price_euros: 1800
    },
    {
      id: '20er',
      name: '20er Paket',
      description: 'Umfassende Klausurvorbereitung',
      case_study_count: 20,
      price_euros: 2360
    },
    {
      id: '25er',
      name: '25er Paket',
      description: 'Maximale Flexibilität',
      case_study_count: 25,
      price_euros: 2875
    },
    {
      id: '30er',
      name: '30er Paket',
      description: 'Das Komplettpaket für Profis',
      case_study_count: 30,
      price_euros: 3375
    }
  ]

  const faqData = [
    {
      question: "Wie funktioniert das Klausur-System?",
      answer: "Du erhältst nach erfolgreicher Buchung einen Link mit einem Zugang zu unserem Dashboard. Hier kannst Du Dich mit Deiner Buchungs-Mail einloggen und siehst Dein gebuchtest Kontingent im Dashboard. Du definierst, welche Klausuren Du erhalten willst und bekommst Deinen Sachverhalt direkt im Dashboard zur Verfügung gestellt. Unser Anspruch ist es, Dir eine übersichtliche Darstellung Deiner Klausurergebnisse zu liefern."
    },
    {
      question: "Wie läuft die Bearbeitung ab?",
      answer: "Du definierst Rechtsgebiet, Teilgebiet und Problemschwerpunkt für jede gebuchte Klausur. Anschließend wählen unsere Dozenten Deine Klausur aus und stelle Dir diese zur Verfügung. Du kannst nun mit der Bearbeitung beginnen und im Anschluss die Dateien als Word- oder PDF-Datei hochladen. Innerhalb von 48 Stunden erhältst Du Deine Korrektur mit wertvollen Tipps von Deinem Dozenten."
    },
    {
      question: "Muss ich alle Klausuren direkt anfordern?",
      answer: "Nein, Du kannst die Klausuren nacheinander bearbeiten und ein Rechtsgebiet auswählen. So bist Du absolut flexibel in Deiner Planung!"
    },
    {
      question: "Wann erhalte ich meine Videobesprechung?",
      answer: "Innerhalb von 48 Stunden stellen Dir unsere Dozenten die Klausurbearbeitung als Video-Datei zur Verfügung."
    },
    {
      question: "Kann ich besondere Wünsche mitteilen?",
      answer: "Klar! Du definierst in erster Linie das Rechtsgebeit und das Teilrechtsgebiet. Im Anschluss kannst Du einen Problemschwerpunkt pro Klausur mitteilen. Somit kann Deine Anforderung wie folgt aussehen: Zivilrecht, BGB AT, Stellvertretung. Alternativ kannst Du Dich auch überraschen lassen und eine beliebige Klausur von Deinem Dozenten erhalten."
    },
    {
      question: "Welche Zahlungsmethoden werden akzeptiert?",
      answer: "Du kannst bei uns mit allen gängigen Zahlungsmethoden bezahlen: Kreditkarte, PayPal, Klarna, Google-Pay, Apple-Pay und Sofort-Überweisung"
    },
    {
      question: "Verfallen meine Klausuren?",
      answer: "Nein. Dein Klausuren-Kontingent bleibt Dir erhalten."
    }
  ]

  const handlePurchase = (packageId: string) => {
    if (!user) {
      // Redirect to login
      return
    }
    // TODO: Implement Stripe checkout
    console.log('Purchase package:', packageId)
  }

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Wähle Dein Klausur-Paket
        </h1>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Spare mit unseren Bundlen und erlebe den maximalen Erfolg in Deiner Klausurpraxis!
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {packages.map((pkg, index) => (
          <div
            key={pkg.id}
            className={`bg-box-bg rounded-lg shadow-lg p-6 relative ${
              pkg.popular ? 'ring-2 ring-primary transform scale-105' : ''
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Beliebteste Wahl
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {pkg.name}
              </h3>
              <p className="text-text-secondary mb-4">
                {pkg.description}
              </p>

              <div className="mb-6">
                <span className="text-3xl font-bold text-primary">
                  €{pkg.price_euros.toLocaleString('de-DE')}
                </span>
                <span className="text-text-secondary ml-2">
                  für {pkg.case_study_count} Klausuren
                </span>
              </div>

              <div className="space-y-2 mb-6 text-left">
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-text-secondary text-sm">
                    {pkg.case_study_count} ausgewählte Sachverhalte
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-text-secondary text-sm">
                    Persönliches Videofeedback innerhalb von 48 Stunden von einem Fach-Dozenten der Akademie Kraatz
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-text-secondary text-sm">
                    Alle Rechtsgebiete verfügbar
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-text-secondary text-sm">
                    Problemschwerpunkte können vorab mitgeteilt werden
                  </span>
                </div>
              </div>

              {user ? (
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                    pkg.popular
                      ? 'bg-primary text-white hover:bg-blue-700'
                      : 'border border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Jetzt kaufen</span>
                </button>
              ) : (
                <Link
                  to="/register"
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                    pkg.popular
                      ? 'bg-primary text-white hover:bg-blue-700'
                      : 'border border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  <span>Jetzt durchstarten!</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-box-bg rounded-lg p-6 max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold text-text-primary mb-6">
          Häufig gestellte Fragen
        </h3>
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center text-left py-2 hover:text-primary transition-colors"
              >
                <h4 className="font-medium text-text-primary">
                  {faq.question}
                </h4>
                {openFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-text-secondary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                )}
              </button>
              {openFaq === index && (
                <div className="mt-3 text-text-secondary text-sm leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
