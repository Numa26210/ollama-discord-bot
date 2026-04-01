import React, { useState } from 'react'
import { Users, MessageSquare, Trophy } from 'lucide-react'

const LeaderboardTable = ({ title, data, icon: Icon }) => {
  return (
    <div className="mb-6 last:mb-0">
      <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Icon className="w-5 h-5 text-purple-600" />
        {title}
      </h4>
      <div className="space-y-2">
        {data && data.length > 0 ? (
          data.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full text-purple-700 text-xs font-bold">
                  {idx + 1}
                </div>
                <span className="text-sm truncate">{item.name}</span>
              </div>
              <span className="text-purple-600 font-semibold ml-2">{item.count}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No data available</p>
        )}
      </div>
    </div>
  )
}

function Leaderboards({ data }) {
  // Map API fields (top_users/top_channels) to component format (name/count)
  const userLeaderboard = (data.top_users || []).map(u => ({
    name: u.username,
    count: u.message_count,
  }))
  const channelLeaderboard = (data.top_channels || []).map(c => ({
    name: c.channel_name,
    count: c.message_count,
  }))

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-purple-600" />
        Leaderboards
      </h3>
      
      <LeaderboardTable
        title="Top Users"
        data={userLeaderboard}
        icon={Users}
      />
      
      <LeaderboardTable
        title="Top Channels"
        data={channelLeaderboard}
        icon={MessageSquare}
      />
    </div>
  )
}

export default Leaderboards
