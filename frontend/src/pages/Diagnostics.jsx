import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Activity, RefreshCw, AlertCircle, CheckCircle, XCircle, AlertTriangle, Wifi } from 'lucide-react'
import { diagnosticsAPI } from '../api/client'

const STATUS_ICON = {
  ok: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
}

export default function Diagnostics() {
  const { serverId } = useOutletContext()
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await diagnosticsAPI.run(serverId)
      setChecks(data)
    } catch {
      setError('Impossible de lancer le diagnostic')
    } finally {
      setLoading(false)
    }
  }, [serverId])

  useEffect(() => { fetchData() }, [fetchData])

  const allOk = checks.length > 0 && checks.every(c => c.status === 'ok')

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Diagnostics</h2>
          <p className="text-sm text-gray-500">Vérification de l'état du système</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Relancer
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Overall status */}
      {!loading && checks.length > 0 && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          allOk ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          {allOk
            ? <CheckCircle className="w-6 h-6 text-green-500" />
            : <AlertTriangle className="w-6 h-6 text-yellow-500" />
          }
          <div>
            <p className={`font-semibold ${allOk ? 'text-green-700' : 'text-yellow-700'}`}>
              {allOk ? 'Tous les systèmes sont opérationnels' : 'Certains problèmes détectés'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {checks.filter(c => c.status === 'ok').length}/{checks.length} vérifications OK
            </p>
          </div>
        </div>
      )}

      {/* Check list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-64" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {checks.map((check, i) => {
            const st = STATUS_ICON[check.status] || STATUS_ICON.error
            const Icon = st.icon
            return (
              <div key={check.name || i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${st.bg}`}>
                    <Icon className={`w-5 h-5 ${st.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{check.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{check.message}</p>
                  </div>
                  {check.latency_ms != null && (
                    <span className="text-xs font-mono text-gray-400">{check.latency_ms}ms</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
