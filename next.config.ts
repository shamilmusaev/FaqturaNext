import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: { typedRoutes: true },
  images: { remotePatterns: [] },
}

export default config
