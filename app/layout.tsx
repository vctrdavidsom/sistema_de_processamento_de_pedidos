import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VALCARNES PEDIDOS',
  description: 'Created bt vctrdavidsomdev',
  generator: 'Next.js',
  applicationName: 'VALCARNES PEDIDOS',
  referrer: 'origin-when-cross-origin',
  keywords: ['Next.js', 'React', 'Tailwind CSS'],
  authors: [{ name: 'Victor Davidson dev' }],

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
