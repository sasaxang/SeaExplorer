'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export default function CrazyGamesSDK() {
    const [isSdkLoaded, setIsSdkLoaded] = useState(false)

    useEffect(() => {
        if (isSdkLoaded && window.CrazyGames) {
            const initSDK = async () => {
                try {
                    await window.CrazyGames.SDK.init()
                    console.log('CrazyGames SDK initialized')
                } catch (error) {
                    console.error('Error initializing CrazyGames SDK:', error)
                }
            }
            initSDK()
        }
    }, [isSdkLoaded])

    return (
        <Script
            src="https://sdk.crazygames.com/crazygames-sdk-v2.js"
            strategy="afterInteractive"
            onLoad={() => setIsSdkLoaded(true)}
        />
    )
}
