import React from 'react'

/**
 * Shared toggle switch used across Tools, Workflows, Automations, etc.
 * @param {boolean} enabled - current state
 * @param {function} onToggle - called on click
 * @param {string} [labelOn] - label when enabled
 * @param {string} [labelOff] - label when disabled
 * @param {boolean} [showLabel] - show text label
 */
export default function ToggleSwitch({
  enabled,
  onToggle,
  labelOn = 'Activé',
  labelOff = 'Désactivé',
  showLabel = true,
}) {
  return (
    <div className="flex items-center gap-2.5">
      {showLabel && (
        <span className={`text-xs font-medium ${enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
          {enabled ? labelOn : labelOff}
        </span>
      )}
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 ${
          enabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
