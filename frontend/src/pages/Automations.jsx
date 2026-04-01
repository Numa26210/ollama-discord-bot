import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Zap, RefreshCw, AlertCircle, Clock } from 'lucide-react'
import { automationsAPI } from '../api/client'
import ToggleSwitch from '../components/ToggleSwitch'

export default function Automations() {
  const { serverId } = useOutletContext()
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await automationsAPI.list(serverId)
      setAutomations(data)
    } catch {
      setError('Impossible de charger les automatisations')
    } finally {
      setLoading(false)
    }
  }, [serverId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleToggle = async (id, current) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_enabled: !current } : a))
    try {
      await automationsAPI.toggle(serverId, id, !current)
    } catch {
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_enabled: current } : a))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automatisations</h2>
          <p className="text-sm text-gray-500">Règles automatiques déclenchées par événements</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Rafraîchir
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {loading && automations.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-40 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-56" />
            </div>
          ))}
        </div>
      ) : automations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune automatisation configurée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map(auto => (
            <div key={auto.id} className={`bg-white rounded-xl border p-5 transition-all ${
              auto.is_enabled ? 'border-purple-200' : 'border-gray-200 opacity-70'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{auto.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{auto.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>Trigger : {auto.trigger_type}</span>
                    {auto.last_run && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Dernier : {auto.last_run}</span>}
                  </div>
                </div>
                <ToggleSwitch
                  enabled={auto.is_enabled}
                  onToggle={() => handleToggle(auto.id, auto.is_enabled)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
