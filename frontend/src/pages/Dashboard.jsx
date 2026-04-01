import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { RefreshCw, MessageSquare, Users, Zap, TrendingUp } from 'lucide-react'
import StatCard from '../components/StatCard'
import DailyVolumeChart from '../components/DailyVolumeChart'
import Leaderboards from '../components/Leaderboards'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { statsAPI } from '../api/client'

export default function Dashboard() {
  const { serverId } = useOutletContext()
  const refreshInterval = import.meta.env.VITE_REFRESH_INTERVAL || 30000
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ overview: null, dailyVolumes: null, leaderboards: null })
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [ov, dv, lb] = await Promise.all([
        statsAPI.getOverview(serverId),
        statsAPI.getDailyVolumes(serverId),
        statsAPI.getLeaderboards(serverId),
      ])
      setData({ overview: ov.data, dailyVolumes: dv.data, leaderboards: lb.data })
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.response?.data?.detail || 'Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [serverId])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, refreshInterval)
    return () => clearInterval(id)
  }, [fetchData, refreshInterval])

  const stats = data.overview

  return (
    <div className="space-y-6">
      {/* Page title / refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h2>
          <p className="text-sm text-gray-500">
            Dernière mise à jour : {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading && !stats ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* KPI Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label={stats.messages_received?.label || 'Messages reçus'}
                value={stats.messages_received?.value ?? 0}
                icon={MessageSquare}
                change={stats.messages_received?.change_percent}
              />
              <StatCard
                label={stats.active_users?.label || 'Utilisateurs actifs'}
                value={stats.active_users?.value ?? 0}
                icon={Users}
                change={stats.active_users?.change_percent}
              />
              <StatCard
                label={stats.ai_triggers?.label || 'Déclenchements IA'}
                value={stats.ai_triggers?.value ?? 0}
                icon={Zap}
                change={stats.ai_triggers?.change_percent}
              />
              <StatCard
                label={stats.bot_responses?.label || 'Réponses du bot'}
                value={stats.bot_responses?.value ?? 0}
                icon={TrendingUp}
                change={stats.bot_responses?.change_percent}
              />
            </div>
          )}

          {/* Chart + Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.dailyVolumes && (
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                <DailyVolumeChart data={data.dailyVolumes} />
              </div>
            )}
            {data.leaderboards && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-hidden">
                <Leaderboards data={data.leaderboards} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
