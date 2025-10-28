import type { Metadata } from 'next'
import { Ubuntu_Mono } from 'next/font/google'
import './globals.css'

const ubuntuMono = Ubuntu_Mono({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Seaquest Game',
  description: 'A modern implementation of the classic Seaquest game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={ubuntuMono.className}>{children}</body>
    </html>
  )
}
