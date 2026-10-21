import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Biarkan request lewat, pengamanan login dilakukan oleh Supabase client di dalam halaman
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
};