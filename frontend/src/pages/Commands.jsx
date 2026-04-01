import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { TerminalSquare, RefreshCw, AlertCircle, Copy, Check, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { commandsAPI } from '../api/client'

export default function Commands() {
  const { serverId } = useOutletContext()
  const [commands, setCommands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formResponse, setFormResponse] = useState('')
  const [formCooldown, setFormCooldown] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await commandsAPI.list(serverId)
      setCommands(data)
    } catch {
      setError('Impossible de charger les commandes')
    } finally {
      setLoading(false)
    }
  }, [serverId])

  useEffect(() => { fetchData() }, [fetchData])

  const copyUsage = (cmd) => {
    navigator.clipboard.writeText(cmd.usage || `!${cmd.name}`)
    setCopiedId(cmd.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const resetForm = () => {
    setFormName('')
    setFormDesc('')
    setFormResponse('')
    setFormCooldown(0)
    setFormError(null)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!formName.trim()) { setFormError('Le nom est requis'); return }
    if (!formResponse.trim()) { setFormError('La réponse est requise'); return }

    try {
      setCreating(true)
      await commandsAPI.create({
        name: formName.trim().toLowerCase(),
        description: formDesc.trim(),
        response: formResponse.trim(),
        cooldown: Math.max(0, formCooldown),
      })
      resetForm()
      setShowForm(false)
      await fetchData()
    } catch (err) {
      const detail = err.response?.data?.detail
      setFormError(typeof detail === 'string' ? detail : 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (cmdId) => {
    try {
      await commandsAPI.remove(cmdId)
      setCommands(prev => prev.filter(c => c.id !== cmdId))
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Erreur lors de la suppression')
    }
  }

  const builtinCmds = commands.filter(c => c.type !== 'custom')
  const customCmds = commands.filter(c => c.type === 'custom')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commandes</h2>
          <p className="text-sm text-gray-500">
            {commands.length} commande{commands.length !== 1 ? 's' : ''} — {customCmds.length} custom
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowForm(f => !f); resetForm() }}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              showForm
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Annuler' : 'Nouvelle commande'}
          </button>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-purple-200 p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-600" />
            Créer une commande custom
          </h3>
          <p className="text-xs text-gray-500">
            Le bot répondra automatiquement avec le texte défini quand un utilisateur tape la commande.
          </p>

          {formError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />{formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Nom de la commande</label>
              <div className="flex items-center">
                <span className="bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg px-3 py-2 text-sm text-gray-500 font-mono">!</span>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32))}
                  placeholder="bonjour"
                  className="flex-1 border border-gray-200 rounded-r-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400">Lettres, chiffres, - et _ uniquement</p>
            </div>

            {/* Cooldown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Cooldown (secondes)</label>
              <input
                type="number"
                min="0"
                max="300"
                value={formCooldown}
                onChange={e => setFormCooldown(parseInt(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Description (optionnelle)</label>
            <input
              type="text"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value.slice(0, 200))}
              placeholder="Répond avec un message de bienvenue"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Response */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Réponse du bot</label>
            <textarea
              value={formResponse}
              onChange={e => setFormResponse(e.target.value.slice(0, 2000))}
              rows={3}
              placeholder="Bienvenue sur le serveur ! 👋 N'hésitez pas à lire les règles dans #rules."
              className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            />
            <p className="text-xs text-gray-400 text-right">{formResponse.length}/2000</p>
          </div>

          {/* Preview */}
          {formName && formResponse && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Aperçu :</p>
              <p className="text-sm">
                <span className="font-mono text-purple-600 font-semibold">!{formName}</span>
                <span className="text-gray-400 mx-2">→</span>
                <span className="text-gray-700">{formResponse.slice(0, 100)}{formResponse.length > 100 ? '…' : ''}</span>
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !formName || !formResponse}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Création...' : 'Créer la commande'}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && commands.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-64" />
            </div>
          ))}
        </div>
      ) : commands.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <TerminalSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune commande configurée</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Built-in commands */}
          {builtinCmds.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                Commandes système ({builtinCmds.length})
              </h3>
              {builtinCmds.map(cmd => (
                <div key={cmd.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-sm font-mono font-semibold">
                          {cmd.usage || `!${cmd.name}`}
                        </code>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          cmd.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {cmd.is_enabled ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1.5">{cmd.description}</p>
                      {cmd.cooldown > 0 && (
                        <span className="text-xs text-gray-400 mt-1 inline-block">Cooldown : {cmd.cooldown}s</span>
                      )}
                    </div>
                    <button onClick={() => copyUsage(cmd)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      {copiedId === cmd.id
                        ? <Check className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4 text-gray-400" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom commands */}
          {customCmds.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                Commandes custom ({customCmds.length})
              </h3>
              {customCmds.map(cmd => (
                <div key={cmd.id} className="bg-white rounded-xl border border-purple-200 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-sm font-mono font-semibold">
                          !{cmd.name}
                        </code>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                          Custom
                        </span>
                        {cmd.is_enabled && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            Actif
                          </span>
                        )}
                      </div>
                      {cmd.description && (
                        <p className="text-sm text-gray-500 mt-1.5">{cmd.description}</p>
                      )}
                      {cmd.cooldown > 0 && (
                        <span className="text-xs text-gray-400 mt-1 inline-block">Cooldown : {cmd.cooldown}s</span>
                      )}

                      {/* Expandable response preview */}
                      <button
                        onClick={() => setExpandedId(expandedId === cmd.id ? null : cmd.id)}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 mt-2 transition-colors"
                      >
                        {expandedId === cmd.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expandedId === cmd.id ? 'Masquer la réponse' : 'Voir la réponse'}
                      </button>
                      {expandedId === cmd.id && (
                        <div className="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                          {cmd.response}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button onClick={() => copyUsage(cmd)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        {copiedId === cmd.id
                          ? <Check className="w-4 h-4 text-green-500" />
                          : <Copy className="w-4 h-4 text-gray-400" />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(cmd.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
