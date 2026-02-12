const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/api-client', '@repo/types'],
  webpack: (config) => {
    // next-auth v5 uses flat file exports (react.js) not directory (react/index.js)
    // Webpack in monorepo resolves incorrectly without this alias
    config.resolve.alias['next-auth/react'] = path.resolve(
      __dirname, '../../node_modules/next-auth/react.js'
    );
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
