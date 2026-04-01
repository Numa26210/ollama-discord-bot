import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Users as UsersIcon, MessageSquare, Zap, Search } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { statsAPI } from '../api/client'

export default function Users() {
  const { serverId } = useOutletContext()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const res = await statsAPI.getLeaderboards(serverId, 50)
        setUsers(res.data.top_users || [])
      } catch (err) {
        setError(err.response?.data?.detail || 'Impossible de charger les utilisateurs')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [serverId])

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Utilisateurs</h2>
          <p className="text-sm text-gray-500">{users.length} utilisateur(s) trouvé(s)</p>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur…"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1" />Messages
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  <Zap className="w-3.5 h-3.5 inline mr-1" />IA triggers
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{u.rank}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-700">{u.message_count}</td>
                    <td className="px-5 py-3 text-right font-semibold text-purple-600">{u.ai_triggered_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
