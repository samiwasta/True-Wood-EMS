'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MonthlyView } from '@/components/reports/monthly-view'
import { YearlyView } from '@/components/reports/yearly-view'

export default function ReportsPage() {
  return (
    <div className="w-full flex flex-col gap-4 w-full max-w-full h-full overflow-x-hidden overflow-y-auto">
      <div className="flex items-center justify-between gap-4 flex-shrink-0 min-w-0">
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-sm text-gray-500">View monthly and yearly attendance data (Working month: 26th to 25th)</p>
        </div>
      </div>
      
      <Tabs defaultValue="monthly" className="w-full max-w-full h-full flex flex-col overflow-x-hidden overflow-y-auto">
        <div className="mb-3 flex-shrink-0">
          <TabsList className="max-w-sm w-full justify-start bg-transparent h-auto p-0">
            <TabsTrigger value="monthly" className="h-10 px-4 py-2 data-[state=active]:bg-[#23887C] data-[state=active]:text-white">
              Monthly View
            </TabsTrigger>
            <TabsTrigger value="yearly" className="h-10 px-4 py-2 data-[state=active]:bg-[#23887C] data-[state=active]:text-white">
              Yearly View
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="monthly" className="mt-0 flex-1 min-h-0 overflow-x-hidden overflow-y-auto">
          <MonthlyView />
        </TabsContent>
        
        <TabsContent value="yearly" className="mt-0">
          <YearlyView />
        </TabsContent>
      </Tabs>
    </div>
  )
}