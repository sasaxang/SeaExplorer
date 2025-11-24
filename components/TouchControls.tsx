'use client'

import { useEffect, useState, useRef } from 'react'
import DynamicJoystick from './DynamicJoystick'

interface TouchControlsProps {
    onControlChange: (control: string, active: boolean) => void
}

export default function TouchControls({ onControlChange }: TouchControlsProps) {
    const [isMobile, setIsMobile] = useState(false)

    // Keep track of current active keys to avoid redundant updates
    const activeKeys = useRef<{ [key: string]: boolean }>({
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    })

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    if (!isMobile) return null

    const handleJoystickMove = (x: number, y: number) => {
        const threshold = 0.3
        const newKeys = {
            ArrowRight: x > threshold,
            ArrowLeft: x < -threshold,
            ArrowDown: y > threshold,
            ArrowUp: y < -threshold
        }

        // Only trigger changes if state changed
        Object.keys(newKeys).forEach(key => {
            if (newKeys[key as keyof typeof newKeys] !== activeKeys.current[key]) {
                activeKeys.current[key] = newKeys[key as keyof typeof newKeys]
                onControlChange(key, newKeys[key as keyof typeof newKeys])
            }
        })
    }

    const btnStyle: React.CSSProperties = {
        width: '60px',
        height: '60px',
        backgroundColor: 'rgba(255, 50, 50, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '24px',
        userSelect: 'none',
        touchAction: 'none',
        cursor: 'pointer'
    }

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Let touches pass through container
        zIndex: 100
    }

    return (
        <div style={containerStyle}>
            {/* Dynamic Joystick (Left Half) */}
            <DynamicJoystick onMove={handleJoystickMove} />

            {/* Action Button (Right Bottom) */}
            <div style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                pointerEvents: 'auto',
                zIndex: 30 // Ensure it's above other layers
            }}>
                <div
                    style={btnStyle}
                    onPointerDown={() => onControlChange('Space', true)}
                    onPointerUp={() => onControlChange('Space', false)}
                    onPointerLeave={() => onControlChange('Space', false)}
                >
                    🔥
                </div>
            </div>
        </div>
    )
}
