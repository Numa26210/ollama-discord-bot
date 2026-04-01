import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Gauge, RefreshCw, AlertCircle, Users, Zap, MessageSquare } from 'lucide-react'
import { quotasAPI } from '../api/client'

function ProgressBar({ used, limit, label, unit = '' }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const overThreshold = pct >= 90

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {used.toLocaleString()}{unit} / {limit.toLocaleString()}{unit}
          <span className="ml-2 text-xs font-mono">({pct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            overThreshold ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-purple-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function Quotas() {
  const { serverId } = useOutletContext()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQuotas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: result } = await quotasAPI.usage(serverId)
      setData(result)
    } catch {
      setError('Impossible de charger les quotas')
    } finally {
      setLoading(false)
    }
  }, [serverId])

  useEffect(() => { fetchQuotas() }, [fetchQuotas])

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quotas & Consommation</h2>
          <p className="text-sm text-gray-500">Suivi de l'utilisation des ressources IA</p>
        </div>
        <button
          onClick={fetchQuotas}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !data ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
              <div className="h-3 bg-gray-100 rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-1">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-500">Requêtes totales</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.total_requests?.toLocaleString() ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-1">
                <Zap className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-500">Tokens consommés</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.total_tokens?.toLocaleString() ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-1">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-500">Utilisateurs actifs</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.active_users ?? 0}</p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-600" />
              Limites de consommation
            </h3>
            <ProgressBar
              label="Requêtes IA (jour)"
              used={data.daily_requests ?? 0}
              limit={data.daily_request_limit ?? 1000}
            />
            <ProgressBar
              label="Tokens Ollama (jour)"
              used={data.daily_tokens ?? 0}
              limit={data.daily_token_limit ?? 500000}
              unit=" tok"
            />
            <ProgressBar
              label="Requêtes IA (mois)"
              used={data.monthly_requests ?? 0}
              limit={data.monthly_request_limit ?? 30000}
            />
          </div>

          {/* Top users table */}
          {data.top_users && data.top_users.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Top consommateurs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Utilisateur</th>
                      <th className="pb-2 font-medium text-right">Requêtes</th>
                      <th className="pb-2 font-medium text-right">Tokens</th>
                      <th className="pb-2 font-medium text-right">% du total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_users.map((user, i) => {
                      const pct = data.total_requests > 0
                        ? ((user.requests / data.total_requests) * 100).toFixed(1)
                        : '0.0'
                      return (
                        <tr key={user.user_id || i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 font-medium text-gray-800">{user.username}</td>
                          <td className="py-2 text-right text-gray-600">{user.requests?.toLocaleString()}</td>
                          <td className="py-2 text-right text-gray-600">{user.tokens?.toLocaleString()}</td>
                          <td className="py-2 text-right">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                              parseFloat(pct) > 20 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
