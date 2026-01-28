export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/orders/:path*',
    '/admin/:path*',
  ],
};
