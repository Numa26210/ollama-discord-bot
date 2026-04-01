import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Workflow, RefreshCw, AlertCircle, Clock } from 'lucide-react'
import { workflowsAPI } from '../api/client'
import ToggleSwitch from '../components/ToggleSwitch'

export default function Workflows() {
  const { serverId } = useOutletContext()
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await workflowsAPI.list(serverId)
      setWorkflows(data)
    } catch {
      setError('Impossible de charger les workflows')
    } finally {
      setLoading(false)
    }
  }, [serverId])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workflows</h2>
          <p className="text-sm text-gray-500">Chaînes d'automatisation configurées</p>
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

      {loading && workflows.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-64" />
            </div>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Workflow className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun workflow configuré</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map(wf => (
            <div key={wf.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{wf.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{wf.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{wf.steps} étapes</span>
                  <span>{wf.trigger}</span>
                </div>
              </div>
              <ToggleSwitch
                enabled={wf.is_active}
                onToggle={() => {}}
                labelOn="Actif"
                labelOff="Inactif"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
