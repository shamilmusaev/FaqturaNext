import { Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google'

export const fontSans = Hanken_Grotesk({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-loaded',
  display: 'swap',
})

export const fontMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-loaded',
  display: 'swap',
})
