import React, { useState, useEffect, useCallback } from 'react'
import { Wrench, RefreshCw, AlertCircle, Check } from 'lucide-react'
import { toolsAPI } from '../api/client'
import ToggleSwitch from '../components/ToggleSwitch'

export default function Tools() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchTools = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await toolsAPI.list()
      setTools(data)
    } catch {
      setError('Impossible de charger les outils')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTools() }, [fetchTools])

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleToggle = async (toolId, currentEnabled) => {
    const newEnabled = !currentEnabled

    // Optimistic update
    setTools(prev =>
      prev.map(t => t.id === toolId ? { ...t, is_enabled: newEnabled } : t)
    )

    try {
      await toolsAPI.toggle(toolId, newEnabled)
      showToast('Outil mis à jour', 'success')
    } catch {
      // Revert on failure
      setTools(prev =>
        prev.map(t => t.id === toolId ? { ...t, is_enabled: currentEnabled } : t)
      )
      showToast('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Outils IA</h2>
          <p className="text-sm text-gray-500">Gérer les outils disponibles pour le bot</p>
        </div>
        <button
          onClick={fetchTools}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
          toast.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && tools.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-40" />
                </div>
              </div>
              <div className="h-8 bg-gray-100 rounded w-16 mt-4" />
            </div>
          ))}
        </div>
      ) : (
        /* Tools grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tools.map(tool => (
            <div
              key={tool.id}
              className={`bg-white rounded-xl border p-5 transition-all ${
                tool.is_enabled
                  ? 'border-purple-200 shadow-sm'
                  : 'border-gray-200 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    tool.is_enabled ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    {tool.icon || '🔧'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{tool.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tool.description}</p>
                  </div>
                </div>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <ToggleSwitch
                  enabled={tool.is_enabled}
                  onToggle={() => handleToggle(tool.id, tool.is_enabled)}
                />
              </div>
            </div>
          ))}

          {tools.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun outil configuré</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
