import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-background text-muted-foreground border-t">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs">
          &copy; {new Date().getFullYear()} Airworthiness Limited. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
        </div>
      </div>
    </footer>
  )
}
