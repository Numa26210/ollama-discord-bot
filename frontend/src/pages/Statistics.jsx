import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { BarChart3, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { statsAPI } from '../api/client'

const PERIOD_OPTIONS = [
  { label: '7 jours', value: 7 },
  { label: '30 jours', value: 30 },
  { label: '90 jours', value: 90 },
]

const PIE_COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe']

export default function Statistics() {
  const { serverId } = useOutletContext()
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [overview, setOverview] = useState(null)
  const [volumes, setVolumes] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [ovRes, volRes] = await Promise.all([
        statsAPI.getOverview(serverId, days),
        statsAPI.getDailyVolumes(serverId, days),
      ])
      setOverview(ovRes.data)
      setVolumes(volRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [serverId, days])

  useEffect(() => { fetchData() }, [fetchData])

  const chartData = (volumes?.data || []).map(item => ({
    date: new Date(item.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    'Messages standard': item.standard_messages || 0,
    'Messages IA': item.ai_triggered_messages || 0,
  }))

  // Build pie data from overview
  const pieData = overview ? [
    { name: 'Messages standard', value: Math.max((overview.messages_received?.value ?? 0) - (overview.ai_triggers?.value ?? 0), 0) },
    { name: 'Déclenchements IA', value: overview.ai_triggers?.value ?? 0 },
    { name: 'Réponses bot', value: overview.bot_responses?.value ?? 0 },
  ].filter(d => d.value > 0) : []

  return (
    <div className="space-y-6">
      {/* Header + period selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statistiques</h2>
          <p className="text-sm text-gray-500">Analyse détaillée de l'activité du bot</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                days === opt.value
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Summary cards */}
          {overview && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total messages"
                value={overview.messages_received?.value ?? 0}
                icon={BarChart3}
                change={overview.messages_received?.change_percent}
                description={`Sur les ${days} derniers jours`}
              />
              <StatCard
                label="Déclenchements IA"
                value={overview.ai_triggers?.value ?? 0}
                icon={BarChart3}
                change={overview.ai_triggers?.change_percent}
              />
              <StatCard
                label="Réponses bot"
                value={overview.bot_responses?.value ?? 0}
                icon={BarChart3}
                change={overview.bot_responses?.change_percent}
              />
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Volume journalier</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Legend />
                    <Bar dataKey="Messages standard" stackId="a" fill="#a78bfa" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Messages IA" stackId="a" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm py-12 text-center">Aucune donnée pour cette période</p>
              )}
            </div>

            {/* Pie chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm py-12 text-center">Aucune donnée</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
