'use client'

import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="border-gray-300 text-gray-700 hover:bg-[#1565C0] hover:text-white hover:border-[#1565C0] font-bold tracking-wide uppercase">
      Print
    </Button>
  )
}
