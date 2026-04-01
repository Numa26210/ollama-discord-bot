import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function DailyVolumeChart({ data }) {
  const volumeData = data.data || []

  // Transform data for Recharts — keys match DailyVolume schema
  const chartData = volumeData.map(item => ({
    date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Standard Messages': item.standard_messages || 0,
    'AI Messages': item.ai_triggered_messages || 0,
  }))

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Message Volume</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
            labelStyle={{ color: '#111827' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="Standard Messages" stackId="a" fill="#a78bfa" />
          <Bar dataKey="AI Messages" stackId="a" fill="#7c3aed" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-gray-500">
        <p>Total messages over the last {volumeData.length} days</p>
      </div>
    </div>
  )
}

export default DailyVolumeChart
