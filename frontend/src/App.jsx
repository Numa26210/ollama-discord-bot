import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Dashboard from './pages/Dashboard'
import Statistics from './pages/Statistics'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Quotas from './pages/Quotas'
import Tools from './pages/Tools'
import Logs from './pages/Logs'
import Workflows from './pages/Workflows'
import Executions from './pages/Executions'
import Commands from './pages/Commands'
import Automations from './pages/Automations'
import Diagnostics from './pages/Diagnostics'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/stats" element={<Statistics />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/quotas" element={<Quotas />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/executions" element={<Executions />} />
          <Route path="/commands" element={<Commands />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/logs" element={<Logs />} />
        </Route>
      </Routes>
    </Router>
  )
}
