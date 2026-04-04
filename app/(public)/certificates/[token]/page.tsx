import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from './print-button'

interface Props {
  params: Promise<{ token: string }>
}

export default async function CertificatePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: cert } = await supabase
    .from('certificates')
    .select(`
      token,
      issued_at,
      recipient_name,
      courses(title)
    `)
    .eq('token', token)
    .single()

  if (!cert) notFound()

  const issuedDate = new Date(cert.issued_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/certificates/${token}`

  return (
    <>
      <div className="print:hidden flex justify-end max-w-3xl mx-auto px-6 pt-6 gap-3">
        <PrintButton />
      </div>

      <div
        id="certificate"
        className="min-h-screen flex items-center justify-center aw-gradient print:bg-white p-8"
      >
        <div className="w-full max-w-2xl bg-card border-4 border-double border-foreground rounded-2xl p-12 text-center shadow-xl print:shadow-none">

          <div className="mb-8">
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
              Certificate of Achievement
            </p>
            <div className="w-16 h-0.5 bg-foreground mx-auto" />
          </div>

          <p className="text-muted-foreground text-lg mb-3">This certifies that</p>

          <h1 className="text-2xl font-semibold text-foreground mb-3">
            {cert.recipient_name ?? 'Unknown'}
          </h1>

          <p className="text-muted-foreground text-lg mb-3">
            has successfully completed
          </p>

          <h2 className="text-lg font-semibold text-foreground mb-8">
            {(cert.courses as any)?.title}
          </h2>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-2xl">🏆</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex justify-between items-end text-sm text-muted-foreground">
            <div className="text-left">
              <p className="font-medium text-foreground">Date issued</p>
              <p>{issuedDate}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-foreground">Certificate ID</p>
              <p className="font-mono text-xs">{token.slice(0, 16).toUpperCase()}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Verify this certificate at{' '}
              <span className="font-mono text-muted-foreground break-all">{verifyUrl}</span>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}