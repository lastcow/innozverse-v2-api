const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/api-client', '@repo/types'],
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  webpack: (config) => {
    // next-auth v5 uses flat file exports (react.js) not directory (react/index.js)
    // Webpack in monorepo resolves incorrectly without this alias
    // Explicit @ alias for Vercel monorepo builds where tsconfig paths may not resolve
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    config.resolve.alias['next-auth/react'] = path.resolve(
      __dirname, '../../node_modules/next-auth/react.js'
    );
    // Ensure monorepo root node_modules is in resolution paths for Vercel
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../../node_modules'),
      'node_modules',
      ...(config.resolve.modules || []),
    ];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig
