import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const API_KEY = import.meta.env.VITE_API_KEY || ''

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor
client.interceptors.request.use(
  config => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor
client.interceptors.response.use(
  response => {
    if (import.meta.env.DEV) {
      console.log(`[API] Response from ${response.config.url}:`, response.data)
    }
    return response
  },
  error => {
    console.error(`[API] Error:`, error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const statsAPI = {
  getOverview: (serverId, days) => 
    client.get(`/servers/${serverId}/stats/overview`, { params: days ? { days } : {} }),
  
  getDailyVolumes: (serverId, days) => 
    client.get(`/servers/${serverId}/stats/daily-volumes`, { params: days ? { days } : {} }),
  
  getLeaderboards: (serverId, limit) => 
    client.get(`/servers/${serverId}/stats/leaderboards`, { params: limit ? { limit } : {} }),
}

export const botAPI = {
  getStatus: (serverId) => 
    client.get(`/bot/status/${serverId}`),
  
  toggle: (serverId, active) => 
    client.post('/bot/toggle', {
      server_id: String(serverId),
      is_active: active
    }, {
      headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
    }),

  getServers: () =>
    client.get('/bot/servers'),
}

export const settingsAPI = {
  get: () =>
    client.get('/settings'),

  update: (settings) =>
    client.put('/settings', settings, {
      headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
    }),

  getOllamaStatus: () =>
    client.get('/settings/ollama/status'),
}

// --- Tools ---
export const toolsAPI = {
  list: () =>
    client.get('/tools'),

  toggle: (toolId, isEnabled) =>
    client.patch(`/tools/${toolId}`, { is_enabled: isEnabled }),
}

// --- Logs ---
export const logsAPI = {
  recent: () =>
    client.get('/logs/recent'),
}

// --- Quotas ---
export const quotasAPI = {
  usage: (serverId) =>
    client.get(`/quotas/usage`, { params: { server_id: serverId } }),
}

// --- Workflows ---
export const workflowsAPI = {
  list: (serverId) =>
    client.get('/workflows', { params: { server_id: serverId } }),
}

// --- Executions ---
export const executionsAPI = {
  list: (serverId) =>
    client.get('/executions', { params: { server_id: serverId } }),
}

// --- Commands ---
export const commandsAPI = {
  list: (serverId) =>
    client.get('/commands', { params: { server_id: serverId } }),

  create: (data) =>
    client.post('/commands', data),

  remove: (cmdId) =>
    client.delete(`/commands/${cmdId}`),

  toggle: (cmdId, isEnabled) =>
    client.patch(`/commands/${cmdId}`, { is_enabled: isEnabled }),
}

// --- Automations ---
export const automationsAPI = {
  list: (serverId) =>
    client.get('/automations', { params: { server_id: serverId } }),

  toggle: (serverId, autoId, isEnabled) =>
    client.patch(`/automations/${autoId}`, { is_enabled: isEnabled }, {
      params: { server_id: serverId },
    }),
}

// --- Diagnostics ---
export const diagnosticsAPI = {
  run: (serverId) =>
    client.get('/diagnostics', { params: { server_id: serverId } }),
}

export default client
