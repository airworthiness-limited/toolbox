import { AppSidebar } from '@/components/app-sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AppSidebar />
      <main className="md:ml-60 min-h-screen bg-white">
        {/* Mobile top padding for the mobile header */}
        <div className="md:hidden h-12" />
        <div className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </>
  )
}
