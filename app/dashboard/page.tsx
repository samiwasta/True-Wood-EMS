'use client'

import { StatCard } from "@/components/stat-card";
import { Users, UserCheck, UserX, Building2 } from 'lucide-react'
import { useEmployeeCount } from '@/lib/hooks/useEmployeeCount'
import { useTodayPresent } from '@/lib/hooks/useTodayPresent'
import { useTodayAbsentLeave } from '@/lib/hooks/useTodayAbsentLeave'
import { useActiveWorkSites } from '@/lib/hooks/useActiveWorkSites'
import { StatCardData } from '@/lib/models/stat-card.model'
import { RecentEmployeesTable } from '@/components/recent-employees-table'
import { AttendanceChart } from '@/components/attendance-chart'
import { QuickActions } from '@/components/quick-actions'
import { UpcomingLeaves } from '@/components/upcoming-leaves'
import { UpcomingHolidays } from '@/components/upcoming-holidays'

export default function DashboardPage() {
  const { count: employeeCount, loading: employeeLoading } = useEmployeeCount()
  const { count: presentCount, loading: presentLoading } = useTodayPresent()
  const { count: absentLeaveCount, loading: absentLeaveLoading } = useTodayAbsentLeave()
  const { count: workSitesCount, loading: workSitesLoading } = useActiveWorkSites()

  const month = new Date().toLocaleDateString('en-US', { month: 'long' });
  const date = new Date().toLocaleDateString('en-US', { day: 'numeric' });
  const year = new Date().toLocaleDateString('en-US', { year: 'numeric' });

  const formattedDate = `${month} ${date}, ${year}`;

  const statCards: StatCardData[] = [
    {
      title: "Total Employees",
      value: employeeLoading ? '...' : employeeCount ?? 0,
      icon: Users,
      iconColor: '#FFFFFF',
      iconBgColor: '#23887C',
      cardBgColor: '#E6F1EF',
      cardBorderColor: '#23887C',
    },
    {
      title: "Present Today",
      value: presentLoading ? '...' : presentCount ?? 0,
      icon: UserCheck,
      iconColor: '#FFFFFF',
      iconBgColor: '#10B981',
      cardBgColor: '#ECFDF5',
      cardBorderColor: '#10B981',
    },
    {
      title: "Absent/Leave Today",
      value: absentLeaveLoading ? '...' : absentLeaveCount ?? 0,
      icon: UserX,
      iconColor: '#FFFFFF',
      iconBgColor: '#EF4444',
      cardBgColor: '#FEF2F2',
      cardBorderColor: '#EF4444',
    },
    {
      title: "Work Sites",
      value: workSitesLoading ? '...' : workSitesCount ?? 0,
      icon: Building2,
      iconColor: '#FFFFFF',
      iconBgColor: '#3B82F6',
      cardBgColor: '#EFF6FF',
      cardBorderColor: '#3B82F6',
      badge: {
        text: 'Active',
        color: '#1E40AF',
        bgColor: '#DBEAFE',
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here&apos;s an overview for {formattedDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
            </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AttendanceChart />
          <RecentEmployeesTable />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <UpcomingLeaves />
          <UpcomingHolidays />
        </div>
      </div>
    </div>
  )
}