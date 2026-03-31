'use client'

import { useState } from 'react'
import type { ExportEntry } from './export-table'
import { getAtaLabel } from '@/lib/logbook/constants'

const FACILITY_LABELS: Record<string, string> = {
  base_maintenance: 'Base',
  line_maintenance: 'Line',
}

const CATEGORY_ORDER = [
  'aeroplane_turbine',
  'aeroplane_piston',
  'helicopter_turbine',
  'helicopter_piston',
]

const CATEGORY_LABELS: Record<string, string> = {
  aeroplane_turbine: 'Aeroplane Turbine (A1/B1.1)',
  aeroplane_piston: 'Aeroplane Piston (A2/B1.2/B3)',
  helicopter_turbine: 'Helicopter Turbine (A3/B1.3)',
  helicopter_piston: 'Helicopter Piston (A4/B1.4)',
}

interface PdfMeta {
  fullName: string
  logbookNumber: string
  amlNumber?: string
  totalEntries: number
  recentTasks: number
  recentTaskThreshold: number
  recentDays: number
  recentDayThreshold: number
  experience: string
  generatedDate: string
}

interface Props {
  entries: ExportEntry[]
  meta: PdfMeta
}

export function PdfDownloadButton({ entries, meta }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 10

      // ── Header ──────────────────────────────────────────────────────────
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Digital Logbook (CAP 741)', margin, 14)

      // Stat boxes
      const stats = [
        { label: 'Name', value: meta.fullName },
        ...(meta.amlNumber ? [{ label: 'AML No.', value: meta.amlNumber }] : []),
        { label: 'Total Entries', value: String(meta.totalEntries) },
        { label: 'Recent Tasks', value: `${meta.recentTasks} / ${meta.recentTaskThreshold}` },
        { label: 'Recent Days', value: `${meta.recentDays} / ${meta.recentDayThreshold}` },
        { label: 'Experience', value: meta.experience },
        { label: 'Logbook ID', value: meta.logbookNumber },
      ]

      const boxY = 18
      const boxH = 10
      const boxW = (pageW - margin * 2) / stats.length

      stats.forEach((s, i) => {
        const x = margin + i * boxW
        doc.setDrawColor(209, 213, 219)
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(x, boxY, boxW - 1, boxH, 1, 1, 'FD')
        doc.setFontSize(5.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(156, 163, 175)
        doc.text(s.label.toUpperCase(), x + 2, boxY + 3.5)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(17, 24, 39)
        doc.text(s.value, x + 2, boxY + 8, { maxWidth: boxW - 4 })
      })

      // ── Grouped tables ───────────────────────────────────────────────────
      let cursorY = boxY + boxH + 6

      const catOrder = CATEGORY_ORDER.filter(cat =>
        entries.some(e => e.aircraft_category === cat)
      )

      for (const cat of catOrder) {
        const catEntries = entries.filter(e => e.aircraft_category === cat)
        if (catEntries.length === 0) continue

        const subChapters = Array.from(new Set(catEntries.map(e => e.ata_chapter ?? ''))).sort()

        // Category heading
        if (cursorY > pageH - 30) { doc.addPage(); cursorY = margin }
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(17, 24, 39)
        doc.text(CATEGORY_LABELS[cat] ?? cat, margin, cursorY)
        doc.setDrawColor(209, 213, 219)
        doc.line(margin, cursorY + 1, pageW - margin, cursorY + 1)
        cursorY += 6

        for (const chapter of subChapters) {
          const chapterEntries = catEntries
            .filter(e => (e.ata_chapter ?? '') === chapter)
            .sort((a, b) => a.task_date.localeCompare(b.task_date))
          if (chapterEntries.length === 0) continue

          // ATA subheading
          if (cursorY > pageH - 25) { doc.addPage(); cursorY = margin }
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(107, 114, 128)
          doc.text((chapter ? getAtaLabel(chapter) : 'Uncategorised').toUpperCase(), margin, cursorY)
          cursorY += 3

          const tableRows = chapterEntries.map(e => [
            new Date(e.task_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            FACILITY_LABELS[e.maintenance_type ?? ''] ?? e.maintenance_type ?? '-',
            e.aircraft_type ?? '-',
            e.aircraft_registration ?? '-',
            e.job_number ?? '-',
            e.description ?? '-',
            '',
          ])

          autoTable(doc, {
            startY: cursorY,
            head: [['Date', 'Base/Line', 'Aircraft Type', 'Aircraft Reg.', 'Job Number', 'Task Detail', 'Supervisor']],
            body: tableRows,
            margin: { left: margin, right: margin },
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 1.5, halign: 'center', textColor: [17, 24, 39] },
            headStyles: { fillColor: [249, 250, 251], textColor: [75, 85, 99], fontStyle: 'bold', fontSize: 6.5 },
            columnStyles: {
              5: { halign: 'left', cellWidth: 'auto' },
              6: { cellWidth: 28 },
            },
            didDrawPage: (data) => {
              // Footer on every page
              doc.setFontSize(6.5)
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(107, 114, 128)
              doc.text(
                `Digitally signed by ${meta.fullName}  |  ID: ${meta.logbookNumber}`,
                margin, pageH - 4
              )
              doc.text(
                `Airworthiness Limited Digital Logbook  |  Generated ${meta.generatedDate}`,
                pageW - margin, pageH - 4, { align: 'right' }
              )
            },
          })

          cursorY = (doc as any).lastAutoTable.finalY + 5
        }

        cursorY += 4
      }

      doc.save(`logbook-${meta.logbookNumber}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold border border-gray-300 rounded-md text-gray-700 hover:bg-[#1565C0] hover:text-white hover:border-[#1565C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
    >
      {loading ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Building...
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download PDF
        </>
      )}
    </button>
  )
}
