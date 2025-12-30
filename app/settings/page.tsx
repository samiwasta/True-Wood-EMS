'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoriesTab } from '@/components/settings/categories-tab'
import { DepartmentsTab } from '@/components/settings/departments-tab'
import { LeaveTypesTab } from '@/components/settings/leave-types-tab'
import { WeeklyOffTab } from '@/components/settings/weekly-off-tab'
import { HolidaysTab } from '@/components/settings/holidays-tab'
import { FolderTree, Building2, Calendar, CalendarX, CalendarDays } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Manage system configurations and preferences</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <Tabs defaultValue="categories" className="w-full">
          <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                <span>Categories</span>
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Departments</span>
              </TabsTrigger>
              <TabsTrigger value="leave-types" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Leave Types</span>
              </TabsTrigger>
              <TabsTrigger value="weekly-off" className="flex items-center gap-2">
                <CalendarX className="h-4 w-4" />
                <span>Weekly Off</span>
              </TabsTrigger>
              <TabsTrigger value="holidays" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Holidays</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6">
            <TabsContent value="categories" className="mt-0">
              <CategoriesTab />
            </TabsContent>
            
            <TabsContent value="departments" className="mt-0">
              <DepartmentsTab />
            </TabsContent>
            
            <TabsContent value="leave-types" className="mt-0">
              <LeaveTypesTab />
            </TabsContent>
            
            <TabsContent value="weekly-off" className="mt-0">
              <WeeklyOffTab />
            </TabsContent>
            
            <TabsContent value="holidays" className="mt-0">
              <HolidaysTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}