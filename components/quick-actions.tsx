'use client'

import { Plus, UserPlus, FileText, Download, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  const actions = [
    {
      icon: UserPlus,
      label: 'Add Employee',
      color: '#23887C',
      bgColor: '#E6F1EF',
      onClick: () => console.log('Add Employee'),
    },
    {
      icon: FileText,
      label: 'Mark Attendance',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      onClick: () => console.log('Mark Attendance'),
    },
    {
      icon: Download,
      label: 'Export Data',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      onClick: () => console.log('Export Data'),
    },
    {
      icon: Settings,
      label: 'Settings',
      color: '#6B7280',
      bgColor: '#F3F4F6',
      onClick: () => console.log('Settings'),
    },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all hover:scale-105"
              style={{
                backgroundColor: action.bgColor,
              }}
            >
              <Icon className="h-6 w-6" style={{ color: action.color }} />
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

