import { TimesheetPageContent } from '@/components/timesheet/timesheet-page-content'

export default function TimesheetPage() {
  return (
    <div className="w-full flex flex-1 flex-col gap-4 max-w-full min-h-0 overflow-x-hidden">
      <TimesheetPageContent />
    </div>
  )
}
