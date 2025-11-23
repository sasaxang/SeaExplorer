'use client'

import { useState, useRef } from 'react'

interface DynamicJoystickProps {
    onMove: (x: number, y: number) => void
}

export default function DynamicJoystick({ onMove }: DynamicJoystickProps) {
    const [active, setActive] = useState(false)
    const [origin, setOrigin] = useState({ x: 0, y: 0 })
    const [current, setCurrent] = useState({ x: 0, y: 0 })
    const touchIdRef = useRef<number | null>(null)

    // Configuration
    const maxRadius = 50 // Max distance the thumbstick can move from center
    const handleSize = 40 // Size of the inner thumbstick
    const baseSize = 100 // Size of the outer boundary

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only handle if not already active
        if (active) return

        const touch = e.changedTouches[0]
        touchIdRef.current = touch.identifier

        const x = touch.clientX
        const y = touch.clientY

        setOrigin({ x, y })
        setCurrent({ x, y })
        setActive(true)

        // Initial move is 0,0
        onMove(0, 0)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!active) return

        // Find the touch that started this joystick
        const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current)
        if (!touch) return

        const x = touch.clientX
        const y = touch.clientY

        // Calculate vector from origin
        let dx = x - origin.x
        let dy = y - origin.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Clamp to max radius
        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx)
            dx = Math.cos(angle) * maxRadius
            dy = Math.sin(angle) * maxRadius
        }

        setCurrent({ x: origin.x + dx, y: origin.y + dy })

        // Normalize output (-1 to 1)
        const normX = dx / maxRadius
        const normY = dy / maxRadius
        onMove(normX, normY)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!active) return

        const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current)
        if (!touch) return

        setActive(false)
        touchIdRef.current = null
        onMove(0, 0)
    }

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%', // Left half of the screen
                height: '100%',
                touchAction: 'none', // Important to prevent browser gestures
                zIndex: 20, // Above game but below other UI if needed
                pointerEvents: 'auto' // Enable pointer events so this div captures touches
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            {/* Active Joystick (Dynamic Position) */}
            {active && (
                <>
                    {/* Outer Circle (Boundary) */}
                    <div
                        style={{
                            position: 'absolute',
                            left: origin.x - baseSize / 2,
                            top: origin.y - baseSize / 2,
                            width: baseSize,
                            height: baseSize,
                            borderRadius: '50%',
                            border: '2px solid rgba(255, 255, 255, 0.5)',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            pointerEvents: 'none',
                        }}
                    />
                    {/* Inner Circle (Thumb) */}
                    <div
                        style={{
                            position: 'absolute',
                            left: current.x - handleSize / 2,
                            top: current.y - handleSize / 2,
                            width: handleSize,
                            height: handleSize,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                            pointerEvents: 'none',
                        }}
                    />
                </>
            )}

            {/* Default Joystick (Fixed Position, Visible when inactive) */}
            {!active && (
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '40px',
                    width: baseSize,
                    height: baseSize,
                    pointerEvents: 'none',
                    opacity: 0.5
                }}>
                    {/* Outer Circle */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    }} />
                    {/* Inner Circle (Centered) */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: handleSize,
                        height: handleSize,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                    }} />
                </div>
            )}
        </div>
    )
}
