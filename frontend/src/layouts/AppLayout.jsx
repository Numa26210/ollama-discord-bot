import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import SidebarNav from '../components/SidebarNav'
import Header from '../components/Header'

export default function AppLayout() {
  const serverId = import.meta.env.VITE_SERVER_ID || '1'
  const [isBotActive, setIsBotActive] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

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
