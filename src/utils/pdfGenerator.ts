import { jsPDF } from 'jspdf'

interface StudentFeedback {
  id: string
  case_study_id: string
  user_id: string
  mistakes_learned: string
  improvements_planned: string
  review_date: string
  email_reminder: boolean
  reminder_sent: boolean
  created_at: string
  updated_at: string
}

interface CaseStudyInfo {
  legal_area: string
  sub_area: string
  focus_area: string
  case_study_number: number
}

interface UserInfo {
  first_name: string
  last_name: string
}

export const generateFeedbackPDF = (
  feedback: StudentFeedback,
  caseStudyInfo: CaseStudyInfo,
  userInfo: UserInfo
): jsPDF => {
  const doc = new jsPDF()
  
  // Clean black and white design
  const blackColor = [0, 0, 0] // Black
  const darkGray = [64, 64, 64] // Dark Gray
  const lightGray = [240, 240, 240] // Light Gray
  const whiteColor = [255, 255, 255] // White
  
  // Set font
  doc.setFont('helvetica')
  
  // Clean header with simple line
  doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2])
  doc.setLineWidth(2)
  doc.line(20, 30, 190, 30)
  
  // Main title - clean and simple
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Feedbackpapier', 20, 25)
  
  // Subtitle
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Persönliche Reflexion & Lernplanung', 20, 40)
  
  // Clean info section
  let yPos = 50
  
  // Section title
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Klausurinformationen', 20, yPos)
  
  // Simple line under title
  doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2])
  doc.setLineWidth(0.5)
  doc.line(20, yPos + 2, 190, yPos + 2)
  
  // Info content - clean and simple
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  let infoY = yPos + 10
  doc.text(`Student: ${userInfo.first_name} ${userInfo.last_name}`, 20, infoY)
  infoY += 6
  doc.text(`Klausur #${caseStudyInfo.case_study_number}: ${caseStudyInfo.legal_area}`, 20, infoY)
  infoY += 6
  doc.text(`Teilgebiet: ${caseStudyInfo.sub_area}`, 20, infoY)
  infoY += 6
  doc.text(`Schwerpunkt: ${caseStudyInfo.focus_area}`, 20, infoY)
  infoY += 6
  doc.text(`Erstellt: ${new Date(feedback.created_at).toLocaleDateString('de-DE')}`, 20, infoY)
  infoY += 6
  doc.text(`Wiederholung: ${new Date(feedback.review_date).toLocaleDateString('de-DE')}`, 20, infoY)
  
  yPos = 110
  
  // Feedback sections - clean design
  yPos += 15
  
  // Section 1: Mistakes learned
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('1. Selbsterkenntnis: Was habe ich falsch gemacht und kann ich aus der Korrektur mitnehmen?', 20, yPos)
  
  // Simple line under title
  doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2])
  doc.setLineWidth(0.5)
  doc.line(20, yPos + 2, 190, yPos + 2)
  
  // Content
  const mistakesLines = doc.splitTextToSize(feedback.mistakes_learned, 150)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(mistakesLines, 20, yPos + 10)
  
  yPos += Math.max(25, mistakesLines.length * 4 + 15)
  
  // Check if we need a new page
  if (yPos > 220) {
    doc.addPage()
    yPos = 20
  }
  
  // Section 2: Improvements planned
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('2. Selbsterkenntnis: Was möchte ich künftig besser machen?', 20, yPos)
  
  // Simple line under title
  doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2])
  doc.setLineWidth(0.5)
  doc.line(20, yPos + 2, 190, yPos + 2)
  
  // Content
  const improvementsLines = doc.splitTextToSize(feedback.improvements_planned, 150)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(improvementsLines, 20, yPos + 10)
  
  yPos += Math.max(25, improvementsLines.length * 4 + 15)
  
  // Review date section
  if (yPos > 220) {
    doc.addPage()
    yPos = 20
  }
  
  // Section title
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('3. Datum eintragen: Wann möchte ich die Inhalte wiederholen?', 20, yPos)
  
  // Simple line under title
  doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2])
  doc.setLineWidth(0.5)
  doc.line(20, yPos + 2, 190, yPos + 2)
  
  // Content
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`${new Date(feedback.review_date).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 20, yPos + 15)
  
  // Clean Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Simple footer line
    doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2])
    doc.setLineWidth(0.5)
    doc.line(20, 280, 190, 280)
    
    // Footer content - clean and simple
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Seite ${i} von ${pageCount}`, 20, 290)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Kraatz Club - Dein Weg zum erfolgreichen Staatsexamen', 85, 290)
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Erstellt am ${new Date().toLocaleDateString('de-DE')}`, 160, 290)
  }
  
  return doc
}

export const downloadFeedbackPDF = (
  feedback: StudentFeedback,
  caseStudyInfo: CaseStudyInfo,
  userInfo: UserInfo
) => {
  try {
    console.log('🔄 Generating PDF for download...', { feedback, caseStudyInfo, userInfo })
    
    // Test if jsPDF works at all
    console.log('📄 Testing jsPDF initialization...')
    const testDoc = new jsPDF()
    console.log('✅ jsPDF initialized successfully')
    
    const doc = generateFeedbackPDF(feedback, caseStudyInfo, userInfo)
    const filename = `Feedbackpapier_${caseStudyInfo.legal_area}_${caseStudyInfo.sub_area}_${new Date(feedback.created_at).toLocaleDateString('de-DE').replace(/\./g, '-')}.pdf`
    console.log('📄 Generated filename:', filename)
    
    // Try to save the document
    console.log('💾 Attempting to save PDF...')
    doc.save(filename)
    console.log('✅ PDF download initiated successfully')
  } catch (error) {
    console.error('❌ Error generating PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    const errorStack = error instanceof Error ? error.stack : 'Kein Stack verfügbar'
    console.error('Error details:', errorMessage, errorStack)
    alert(`Fehler beim Erstellen des PDFs: ${errorMessage}. Bitte versuchen Sie es erneut.`)
  }
}

export const previewFeedbackPDF = (
  feedback: StudentFeedback,
  caseStudyInfo: CaseStudyInfo,
  userInfo: UserInfo
): string => {
  const doc = generateFeedbackPDF(feedback, caseStudyInfo, userInfo)
  return doc.output('datauristring')
}

// Test function to check if jsPDF works
export const testPDFDownload = () => {
  try {
    console.log('🧪 Testing basic PDF functionality...')
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Test PDF', 20, 20)
    doc.text('Dies ist ein Test-PDF für jsPDF.', 20, 40)
    doc.save('test.pdf')
    console.log('✅ Basic PDF test successful')
    return true
  } catch (error) {
    console.error('❌ Basic PDF test failed:', error)
    return false
  }
}
