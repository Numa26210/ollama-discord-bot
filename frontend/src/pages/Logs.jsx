import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ScrollText, Trash2, Copy, Check, AlertCircle } from 'lucide-react'
import { logsAPI } from '../api/client'

const LEVELS = ['ALL', 'INFO', 'WARNING', 'ERROR']

const LEVEL_COLORS = {
  DEBUG: 'text-gray-400',
  INFO: 'text-blue-400',
  WARNING: 'text-yellow-400',
  ERROR: 'text-red-400',
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const endRef = useRef(null)
  const containerRef = useRef(null)
  const intervalRef = useRef(null)

  const fetchLogs = useCallback(async () => {
    try {
      const { data } = await logsAPI.recent()
      setLogs(data)
      setError(null)
    } catch {
      setError('Impossible de récupérer les logs')
    }
  }, [])

  // Start polling on mount
  useEffect(() => {
    fetchLogs()
    intervalRef.current = setInterval(fetchLogs, 2000)
    return () => clearInterval(intervalRef.current)
  }, [fetchLogs])

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50)
  }

  const filteredLogs = filter === 'ALL'
    ? logs
    : logs.filter(l => l.level === filter)

  const handleClear = () => setLogs([])

  const handleCopy = () => {
    const text = filteredLogs
      .map(l => `[${l.timestamp}] [${l.level}] ${l.message}`)
      .join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Logs en temps réel</h2>
          <p className="text-sm text-gray-500">
            {filteredLogs.length} entrée{filteredLogs.length !== 1 ? 's' : ''} — polling toutes les 2s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer
          </button>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-1.5">
        {LEVELS.map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === level
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Terminal */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 bg-gray-950 rounded-xl border border-gray-800 p-4 overflow-y-auto font-mono text-sm"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            <ScrollText className="w-8 h-8 mr-3 opacity-30" />
            <span>En attente de logs...</span>
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={`${log.timestamp}-${i}`} className="flex gap-3 py-0.5 hover:bg-white/5 px-1 rounded">
              <span className="text-gray-600 shrink-0 text-xs leading-5">
                {log.timestamp}
              </span>
              <span className={`shrink-0 text-xs leading-5 font-semibold w-16 ${LEVEL_COLORS[log.level] || 'text-gray-400'}`}>
                {log.level}
              </span>
              <span className="text-gray-300 text-xs leading-5 break-all">
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true)
            endRef.current?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="fixed bottom-6 right-6 bg-purple-600 text-white text-xs px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        >
          ↓ Auto-scroll
        </button>
      )}
    </div>
  )
}
