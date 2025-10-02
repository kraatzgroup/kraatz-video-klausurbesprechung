import React from 'react'
import { X, Download, FileText } from 'lucide-react'

interface FeedbackPDFPreviewProps {
  isOpen: boolean
  onClose: () => void
  pdfDataUri: string
  filename: string
  onDownload: () => void
}

export const FeedbackPDFPreview: React.FC<FeedbackPDFPreviewProps> = ({
  isOpen,
  onClose,
  pdfDataUri,
  filename,
  onDownload
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Feedbackpapier Vorschau</h3>
              <p className="text-sm text-gray-600">{filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>PDF herunterladen</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4 bg-gray-100">
          <div className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
            <iframe
              src={pdfDataUri}
              className="w-full h-full border-0"
              title="PDF Preview"
              style={{ minHeight: '600px' }}
            />
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              💡 Tipp: Du kannst das PDF herunterladen und für deine Lernplanung verwenden.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Schließen
              </button>
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Herunterladen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
