import React from 'react'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
      </div>
    </div>
  )
}

export default LoadingSpinner
