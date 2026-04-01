import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Save, Cpu, Thermometer, Hash, MessageSquare, RefreshCw,
  Wifi, WifiOff, AlertTriangle, Check, ChevronDown, Terminal,
  Zap, Globe, Type
} from 'lucide-react'
import { settingsAPI } from '../api/client'

const LOG_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR']

export default function Settings() {
  const { serverId } = useOutletContext()
  // Settings state
  const [settings, setSettings] = useState({
    ollama_model: '',
    ollama_api_url: 'http://localhost:11434',
    response_max_tokens: 256,
    response_temperature: 0.7,
    system_prompt: '',
    command_prefix: '!',
    log_level: 'INFO',
  })

  // Ollama state
  const [ollamaStatus, setOllamaStatus] = useState(null)
  const [ollamaLoading, setOllamaLoading] = useState(true)

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [promptPreview, setPromptPreview] = useState(false)

  // Load settings from backend
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await settingsAPI.get()
      setSettings(data)
      setDirty(false)
    } catch (e) {
      setError('Impossible de charger la configuration')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load Ollama status
  const loadOllamaStatus = useCallback(async () => {
    try {
      setOllamaLoading(true)
      const { data } = await settingsAPI.getOllamaStatus()
      setOllamaStatus(data)
    } catch {
      setOllamaStatus({ online: false, url: settings.ollama_api_url, models: [], current_model: '' })
    } finally {
      setOllamaLoading(false)
    }
  }, [settings.ollama_api_url])

  useEffect(() => { loadSettings() }, [loadSettings])
  useEffect(() => { loadOllamaStatus() }, [])

  // Update a single field
  const updateField = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      await settingsAPI.update(settings)
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const activeModel = ollamaStatus?.models?.find(m => m.name === settings.ollama_model)
  const modelInstalled = ollamaStatus?.online && activeModel

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
        <span className="ml-3 text-gray-500">Chargement de la configuration...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
          <p className="text-sm text-gray-500">Paramètres du bot — Serveur {serverId}</p>
        </div>
        <button
          onClick={loadSettings}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Recharger"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Ollama connection status card */}
      <div className={`rounded-xl border p-5 transition-colors ${
        ollamaStatus?.online
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {ollamaLoading ? (
              <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
            ) : ollamaStatus?.online ? (
              <div className="relative">
                <Wifi className="w-5 h-5 text-emerald-600" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              </div>
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className={`font-semibold text-sm ${ollamaStatus?.online ? 'text-emerald-800' : 'text-red-800'}`}>
                {ollamaLoading ? 'Connexion...' : ollamaStatus?.online ? 'Ollama connecté' : 'Ollama hors ligne'}
              </p>
              <p className="text-xs text-gray-500 font-mono">{ollamaStatus?.url || settings.ollama_api_url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ollamaStatus?.online && (
              <span className="text-xs bg-white/70 text-gray-700 px-2 py-1 rounded-full">
                {ollamaStatus.models.length} modèle{ollamaStatus.models.length !== 1 ? 's' : ''} disponible{ollamaStatus.models.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={loadOllamaStatus}
              disabled={ollamaLoading}
              className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
              title="Tester la connexion"
            >
              <RefreshCw className={`w-4 h-4 ${ollamaLoading ? 'animate-spin text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Model selection + Ollama URL */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Cpu className="w-5 h-5 text-purple-600" />
          Modèle IA
        </div>

        {/* Ollama URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            URL Ollama
          </label>
          <input
            type="text"
            value={settings.ollama_api_url}
            onChange={e => updateField('ollama_api_url', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="http://localhost:11434"
          />
        </div>

        {/* Model dropdown — real models from Ollama if online */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Modèle actif
          </label>
          {ollamaStatus?.online && ollamaStatus.models.length > 0 ? (
            <div className="space-y-2">
              <select
                value={settings.ollama_model}
                onChange={e => updateField('ollama_model', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                {ollamaStatus.models.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.size ? `— ${m.size}` : ''}
                  </option>
                ))}
                {/* Keep current if not in list */}
                {!ollamaStatus.models.find(m => m.name === settings.ollama_model) && settings.ollama_model && (
                  <option value={settings.ollama_model}>
                    {settings.ollama_model} (non installé)
                  </option>
                )}
              </select>
              {/* Model status badge */}
              <div className="flex items-center gap-2">
                {modelInstalled ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3" /> Modèle installé
                    {activeModel?.size && <span className="text-emerald-500">• {activeModel.size}</span>}
                  </span>
                ) : ollamaStatus?.online ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Modèle non trouvé sur Ollama
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={settings.ollama_model}
                onChange={e => updateField('ollama_model', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="mistral"
              />
              <p className="text-xs text-gray-400 mt-1">
                {ollamaLoading ? 'Connexion à Ollama...' : 'Ollama hors ligne — saisie manuelle du nom de modèle'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* System Prompt */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            System Prompt
          </div>
          <button
            onClick={() => setPromptPreview(p => !p)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              promptPreview
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {promptPreview ? 'Éditer' : 'Aperçu'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Définit la personnalité et le comportement du bot. Envoyé au début de chaque conversation IA.
        </p>
        {promptPreview ? (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap border border-gray-100 min-h-[120px]">
            {settings.system_prompt || <span className="text-gray-400 italic">Aucun prompt défini</span>}
          </div>
        ) : (
          <textarea
            value={settings.system_prompt}
            onChange={e => updateField('system_prompt', e.target.value)}
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            placeholder="Tu es un assistant Discord utile et amical. Réponds de façon concise."
          />
        )}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{settings.system_prompt.length} caractères</span>
          <span>{settings.system_prompt.split(/\s+/).filter(Boolean).length} mots</span>
        </div>
      </div>

      {/* Generation parameters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Zap className="w-5 h-5 text-purple-600" />
          Paramètres de génération
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
              <Thermometer className="w-4 h-4 text-purple-500" />
              Température
            </div>
            <span className="text-sm font-mono bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full">
              {settings.response_temperature.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-400">Contrôle la créativité des réponses.</p>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={settings.response_temperature}
            onChange={e => updateField('response_temperature', parseFloat(e.target.value))}
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">🎯 Précis (0)</span>
            <span className="flex items-center gap-1">🎨 Créatif (1.5)</span>
          </div>
          {/* Visual indicator bar */}
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${(settings.response_temperature / 1.5) * 100}%`,
                background: `linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444)`,
              }}
            />
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
              <Hash className="w-4 h-4 text-purple-500" />
              Tokens max
            </div>
            <span className="text-sm font-mono bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full">
              {settings.response_max_tokens}
            </span>
          </div>
          <p className="text-xs text-gray-400">Longueur maximale de chaque réponse IA.</p>
          <input
            type="range"
            min="64"
            max="4096"
            step="64"
            value={settings.response_max_tokens}
            onChange={e => updateField('response_max_tokens', parseInt(e.target.value))}
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>64 — Court</span>
            <span>4096 — Long</span>
          </div>
          {/* Rough word estimate */}
          <p className="text-xs text-gray-400 italic">
            ≈ {Math.round(settings.response_max_tokens * 0.75)} mots environ
          </p>
        </div>
      </div>

      {/* Bot behavior */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Terminal className="w-5 h-5 text-purple-600" />
          Comportement du bot
        </div>

        {/* Command prefix */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Type className="w-3.5 h-3.5" />
              Préfixe de commande
            </label>
            <input
              type="text"
              value={settings.command_prefix}
              onChange={e => updateField('command_prefix', e.target.value.slice(0, 3))}
              maxLength={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
              placeholder="!"
            />
            <p className="text-xs text-gray-400">Ex: !help, /help, $help</p>
          </div>

          {/* Log level */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Niveau de log</label>
            <div className="flex gap-1">
              {LOG_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => updateField('log_level', level)}
                  className={`flex-1 text-xs py-2 rounded-lg transition-colors font-medium ${
                    settings.log_level === level
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className={`sticky bottom-4 flex items-center justify-between rounded-xl border p-4 transition-all ${
        dirty
          ? 'bg-purple-50 border-purple-200 shadow-lg shadow-purple-100'
          : 'bg-white border-gray-200'
      }`}>
        <div className="text-sm text-gray-500">
          {dirty ? (
            <span className="text-purple-700 font-medium">Modifications non sauvegardées</span>
          ) : saved ? (
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" /> Sauvegardé dans .env
            </span>
          ) : (
            <span className="text-gray-400">Les changements nécessitent un redémarrage du bot</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              onClick={loadSettings}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-white transition-colors"
            >
              Annuler
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
              dirty
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}
