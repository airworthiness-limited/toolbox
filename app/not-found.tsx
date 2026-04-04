import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-extrabold text-foreground">404</p>
        <h1 className="text-xl font-semibold text-foreground mt-4">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button>Back to home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
