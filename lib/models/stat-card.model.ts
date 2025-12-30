import { LucideIcon } from 'lucide-react'

export interface StatCardData {
  title: string
  value: number | string
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  cardBgColor: string
  cardBorderColor: string
  badge?: {
    text: string
    color: string
    bgColor: string
  }
}

export type StatCardProps = StatCardData

