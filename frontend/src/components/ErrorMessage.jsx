import React from 'react'
import { AlertCircle, X } from 'lucide-react'

function ErrorMessage({ message, onClose }) {
  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-700">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 hover:bg-red-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-red-500" />
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
