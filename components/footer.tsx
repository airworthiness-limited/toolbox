import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-950 text-white/60 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-tight mb-3">Airworthiness Limited</h3>
            <p className="text-xs leading-relaxed">
              The digital platform for UK aircraft maintenance professionals. CAA-aligned licence management, digital logbooks, and continuation training.
            </p>
          </div>

          {/* Professionals */}
          <div>
            <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-3">Professionals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/progress" className="hover:text-white transition-colors">Module Tracker</Link></li>
              <li><Link href="/logbook" className="hover:text-white transition-colors">Digital Logbook</Link></li>
              <li><Link href="/courses" className="hover:text-white transition-colors">Continuation Training</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-3">Contact</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="mailto:contact@airworthiness.org.uk" className="hover:text-white transition-colors">
                  contact@airworthiness.org.uk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Airworthiness Limited. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
