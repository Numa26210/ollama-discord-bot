import React from 'react'

const StatCard = ({ label, value, icon: Icon, change, description }) => {
  const hasChange = change !== null && change !== undefined
  const isPositive = hasChange && change >= 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {hasChange && (
            <p className={`text-xs mt-1 font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{change}% vs période précédente
            </p>
          )}
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {Icon && (
          <div className="bg-purple-50 p-2.5 rounded-lg">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
