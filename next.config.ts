import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const config: NextConfig = {
  experimental: {
    typedRoutes: true,
    // Tree-shake barrel imports for these libs so dev/build only pulls the
    // modules actually used in the app, not the entire barrel file.
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      'motion',
      'motion/react',
      'sonner',
    ],
  },
  // react-pdf ships with CommonJS internals + native-ish font parsing that
  // Turbopack/webpack can't bundle reliably for server runtimes. Mark it as
  // external so Node loads it from node_modules at request time.
  serverExternalPackages: ['@react-pdf/renderer'],
}

export default withNextIntl(config)
