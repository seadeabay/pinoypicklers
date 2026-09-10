import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes
  const publicRoutes = ['/auth/login', '/auth/register', '/api/auth']
  if (publicRoutes.some(r => pathname.startsWith(r))) return NextResponse.next()

  // Require login for everything else
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Admin-only routes
  const adminRoutes = ['/admin']
  if (adminRoutes.some(r => pathname.startsWith(r))) {
    if (req.auth?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
}
