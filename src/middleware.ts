import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const publicRoutes = ['/login', '/setup-password', '/api/auth/login', '/api/auth/setup-password'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifyToken(token);
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-tenant-id', payload.tenantId || '');

    if (
      pathname.startsWith('/super-admin') ||
      (pathname.startsWith('/api/tenants') && req.method !== 'GET')
    ) {
      if (payload.role !== 'super_admin') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    if (pathname.startsWith('/catalog') || (pathname.startsWith('/api/products') && req.method !== 'GET')) {
      if (payload.role !== 'super_admin' && payload.role !== 'tenant_admin') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
