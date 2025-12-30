'use client'

import { WorkSitesList } from '@/components/work-sites/work-sites-list'

export default function WorkSitesPage() {
  return (
    <div className="flex flex-col gap-6">
      <WorkSitesList />
    </div>
  )
}