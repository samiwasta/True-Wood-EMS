'use client'

import { StatCardProps } from "@/lib/models/stat-card.model"

export function StatCard({ title, value, icon: Icon, iconColor, iconBgColor, cardBgColor, cardBorderColor, badge }: StatCardProps) {
  const getCardBgClass = (color: string) => {
    if (color === 'white') return 'bg-white'
    return `bg-${color}`
  }

  return (
    <div 
      className={`${getCardBgClass(cardBgColor)} p-6 rounded-lg border hover:shadow-md transition-shadow duration-300`}
      style={{
        ...(cardBgColor !== 'white' ? { backgroundColor: cardBgColor } : {}),
        borderColor: cardBorderColor,
      }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium text-gray-500">{title}</h2>
            {badge && (
              <span 
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  color: badge.color,
                  backgroundColor: badge.bgColor
                }}
              >
                {badge.text}
              </span>
            )}
          </div>
          <p className="text-3xl font-semibold">{value}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Icon 
            className="size-10 rounded-lg p-2" 
            style={{ 
              color: iconColor,
              backgroundColor: iconBgColor
            }} 
          />
        </div>
      </div>
    </div>
  )
}