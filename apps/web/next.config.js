/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@finance-tracker/ui'],
  env: {
    NEXT_PUBLIC_BOT_USERNAME: process.env.NEXT_PUBLIC_BOT_USERNAME,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://web.telegram.org",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig