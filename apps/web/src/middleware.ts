export { auth as default } from '@/auth';

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - api (API routes — especially webhooks)
     * - _next (Next.js internals)
     * - static files
     */
    '/dashboard/:path*',
    '/user/:path*',
    '/orders/:path*',
    '/admin/:path*',
  ],
};
