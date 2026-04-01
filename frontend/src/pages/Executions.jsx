import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ListTree, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { executionsAPI } from '../api/client'

const STATUS_MAP = {
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Succès' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Erreur' },
  running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50', label: 'En cours' },
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'En attente' },
}

export default function Executions() {
  const { serverId } = useOutletContext()
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await executionsAPI.list(serverId)
      setExecutions(data)
    } catch {
      setError('Impossible de charger les exécutions')
    } finally {
      setLoading(false)
    }
  }, [serverId])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exécutions</h2>
          <p className="text-sm text-gray-500">Historique des exécutions de workflows et commandes</p>
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

      {loading && executions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-gray-100 rounded" />)}
        </div>
      ) : executions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ListTree className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune exécution enregistrée</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Workflow / Commande</th>
                <th className="px-5 py-3 font-medium">Utilisateur</th>
                <th className="px-5 py-3 font-medium">Durée</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {executions.map(ex => {
                const s = STATUS_MAP[ex.status] || STATUS_MAP.pending
                const Icon = s.icon
                return (
                  <tr key={ex.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${s.bg} ${s.color}`}>
                        <Icon className={`w-3.5 h-3.5 ${ex.status === 'running' ? 'animate-spin' : ''}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{ex.name}</td>
                    <td className="px-5 py-3 text-gray-600">{ex.username}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{ex.duration_ms ? `${ex.duration_ms}ms` : '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{ex.created_at}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
