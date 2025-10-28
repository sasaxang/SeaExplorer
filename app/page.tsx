'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ImageFormat } from '@/components/GameImageLoader'

// Dynamically import the game component with no SSR
const SeaquestGame = dynamic(() => import('@/components/SeaquestGame'), {
  ssr: false,
})

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)
  // Always use PNG format
  const imageFormat: ImageFormat = 'png'

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <main className="game-container">
      <h1 className="game-title">SEAQUEST</h1>
      
      {isMounted && (
        <SeaquestGame imageFormat={imageFormat} />
      )}
    </main>
  )
}
