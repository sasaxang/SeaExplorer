import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CrazyGamesSDK from '@/components/CrazyGamesSDK'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Seaquest - Underwater Adventure',
  description: 'A 2D underwater game inspired by Seaquest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CrazyGamesSDK />
        {children}
      </body>
    </html>
  )
}
