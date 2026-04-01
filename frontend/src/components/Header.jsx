import React, { useState, useEffect } from 'react'
import { Power, RefreshCw, Server, Sun, Moon } from 'lucide-react'
import { botAPI } from '../api/client'

export default function Header({ serverId, isBotActive, setIsBotActive, darkMode, setDarkMode }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStatus()
  }, [serverId])

  const fetchStatus = async () => {
    try {
      const res = await botAPI.getStatus(serverId)
      setIsBotActive(res.data.is_active ?? false)
      setError(null)
    } catch {
      setError('Statut indisponible')
    }
  }

  const handleToggle = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await botAPI.toggle(serverId, !isBotActive)
      setIsBotActive(res.data.is_active)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Left: server info */}
      <div className="flex items-center gap-3">
        <Server className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Serveur</span>
        <span className={`text-sm font-mono px-2 py-0.5 rounded ${
          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}>
          {serverId}
        </span>
      </div>

      {/* Right: dark mode + bot status toggle */}
      <div className="flex items-center gap-4">
        {error && <span className="text-red-500 text-xs">{error}</span>}

        {/* Day/Night toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode
              ? 'hover:bg-gray-700 text-yellow-400'
              : 'hover:bg-gray-100 text-gray-500'
          }`}
          title={darkMode ? 'Mode jour' : 'Mode nuit'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className={`w-px h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${isBotActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isBotActive ? 'Bot actif' : 'Bot inactif'}
          </span>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            isBotActive ? 'bg-green-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              isBotActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className={`p-1.5 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
          title="Rafraîchir le statut"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  )
}
