import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BarChart3, Users, Settings, Bot,
  Gauge, Wrench, Workflow, ListTree, TerminalSquare,
  Zap, Activity, ScrollText
} from 'lucide-react'

const navGroups = [
  {
    label: 'Analyse & Gestion',
    items: [
      { name: "Vue d'ensemble", path: '/overview', icon: LayoutDashboard },
      { name: 'Statistiques', path: '/stats', icon: BarChart3 },
      { name: 'Utilisateurs', path: '/users', icon: Users },
      { name: 'Configuration', path: '/settings', icon: Settings },
    ],
  },
  {
    label: 'Intelligence & Automatisation',
    items: [
      { name: 'Quotas', path: '/quotas', icon: Gauge },
      { name: 'Outils IA', path: '/tools', icon: Wrench },
      { name: 'Workflows', path: '/workflows', icon: Workflow },
      { name: 'Exécutions', path: '/executions', icon: ListTree },
      { name: 'Commandes', path: '/commands', icon: TerminalSquare },
      { name: 'Automatisations', path: '/automations', icon: Zap },
      { name: 'Diagnostics', path: '/diagnostics', icon: Activity },
      { name: 'Logs', path: '/logs', icon: ScrollText },
    ],
  },
]

export default function Sidebar({ darkMode }) {
  return (
    <aside className={`w-64 border-r flex flex-col shrink-0 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Logo */}
      <div className={`p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h1 className={`font-bold text-lg flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          <Bot className="w-6 h-6 text-purple-500" />
          Ollama Discord Bot
        </h1>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Control Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h2 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 px-2 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {group.label}
            </h2>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? darkMode
                          ? 'bg-purple-900/40 text-purple-400 border-l-2 border-purple-500'
                          : 'bg-purple-100 text-purple-700 border-l-2 border-purple-600'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className={`text-xs text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>v1.0.0</p>
      </div>
    </aside>
  )
}
