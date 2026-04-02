import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import SidebarNav from '../components/SidebarNav'
import Header from '../components/Header'
import { botAPI } from '../api/client'

export default function AppLayout() {
  const envServerId = import.meta.env.VITE_SERVER_ID
  const [serverId, setServerId] = useState(envServerId || null)
  const [isBotActive, setIsBotActive] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })

  // Auto-detect server ID when not configured in .env
  useEffect(() => {
    if (envServerId) return // already configured, skip
    let cancelled = false
    const detect = async () => {
      try {
        const { data } = await botAPI.getServers()
        if (!cancelled && data.length > 0) {
          setServerId(data[0].id)
        }
      } catch {
        // Backend may not be ready yet — retry after a delay
        if (!cancelled) setTimeout(detect, 3000)
      }
    }
    detect()
    // Also poll every 5s until a server appears (bot may not have connected yet)
    const interval = setInterval(detect, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [envServerId])

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Show a waiting state while server ID is being detected
  if (!serverId) {
    return (
      <div className={`flex h-screen items-center justify-center font-sans ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm opacity-70">En attente du serveur Discord...</p>
          <p className="text-xs opacity-50">Le bot doit être connecté à un serveur.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen font-sans ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
      <SidebarNav darkMode={darkMode} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          serverId={serverId}
          isBotActive={isBotActive}
          setIsBotActive={setIsBotActive}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <div className={`flex-1 overflow-y-auto p-6 ${darkMode ? 'bg-gray-900' : ''}`}>
          <Outlet context={{ serverId, isBotActive, setIsBotActive, darkMode }} />
        </div>
      </main>
    </div>
  )
}
