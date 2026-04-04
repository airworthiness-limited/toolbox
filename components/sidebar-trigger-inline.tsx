'use client'

import { SidebarTrigger } from '@/components/app-sidebar'

export function SidebarTriggerInline() {
  return (
    <div className="md:hidden float-left -ml-8 mt-0.5 mr-2">
      <SidebarTrigger />
    </div>
  )
}
