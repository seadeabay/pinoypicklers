import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'PinoyPicklers by Giftists',
  description: 'Pickleball tournament & queue management',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'PinoyPicklers' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#071f13',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-brand-dark text-white font-serif min-h-screen antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { background: '#0d3d24', border: '1px solid rgba(95,207,122,0.3)', color: '#e8f5e2' },
          }}
        />
      </body>
    </html>
  )
}
