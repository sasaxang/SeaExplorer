'use client'

import { useState, useRef, useEffect } from 'react'

interface DynamicJoystickProps {
    onMove: (x: number, y: number) => void
}

export default function DynamicJoystick({ onMove }: DynamicJoystickProps) {
    const [active, setActive] = useState(false)
    const [current, setCurrent] = useState({ x: 0, y: 0 })
    const touchIdRef = useRef<number | null>(null)
    const joystickRef = useRef<HTMLDivElement>(null)

    // Configuration
    const maxRadius = 50 // Max distance the thumbstick can move from center
    const handleSize = 40 // Size of the inner thumbstick
    const baseSize = 100 // Size of the outer boundary

    // Fixed position configuration
    const fixedBottom = 40
    const fixedLeft = 40

    // Use ref to store center position to avoid stale closures and handle resize/rotation correctly
    const fixedCenterRef = useRef({
        x: fixedLeft + baseSize / 2,
        y: 0 // Will be set in useEffect
    })

    // Update fixed center on mount and resize
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateCenter = () => {
            if (joystickRef.current) {
                const rect = joystickRef.current.getBoundingClientRect()
                fixedCenterRef.current = {
                    x: rect.left + fixedLeft + baseSize / 2,
                    y: rect.bottom - fixedBottom - baseSize / 2
                }
            }
        }

        // Initial set
        updateCenter()

        // Update on resize and scroll to be safe
        window.addEventListener('resize', updateCenter)
        window.addEventListener('scroll', updateCenter)
        return () => {
            window.removeEventListener('resize', updateCenter)
            window.removeEventListener('scroll', updateCenter)
        }
    }, [])

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only handle if not already active
        if (active) return

        // Check all changed touches to see if any are within the joystick area
        const touch = Array.from(e.changedTouches).find(t => {
            const dx = t.clientX - fixedCenterRef.current.x
            const dy = t.clientY - fixedCenterRef.current.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            return distance <= baseSize // Allow touching slightly outside the visual circle
        })

        if (!touch) return

        touchIdRef.current = touch.identifier

        // Calculate initial position relative to center
        const dx = touch.clientX - fixedCenterRef.current.x
        const dy = touch.clientY - fixedCenterRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Clamp to max radius if needed (though touch start check mostly handles this)
        let clampedDx = dx
        let clampedDy = dy

        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx)
            clampedDx = Math.cos(angle) * maxRadius
            clampedDy = Math.sin(angle) * maxRadius
        }

        setCurrent({ x: clampedDx, y: clampedDy })
        setActive(true)

        // Calculate normalized output
        const normX = clampedDx / maxRadius
        const normY = clampedDy / maxRadius
        onMove(normX, normY)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!active) return

        // Find the touch that started this joystick
        const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current)
        if (!touch) return

        const x = touch.clientX
        const y = touch.clientY

        // Calculate vector from fixed center
        let dx = x - fixedCenterRef.current.x
        let dy = y - fixedCenterRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Clamp to max radius
        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx)
            dx = Math.cos(angle) * maxRadius
            dy = Math.sin(angle) * maxRadius
        }

        setCurrent({ x: dx, y: dy })

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
        setCurrent({ x: 0, y: 0 }) // Reset to center
        touchIdRef.current = null
        onMove(0, 0)
    }

    return (
        <div
            ref={joystickRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%', // Cover full screen to catch moves that go outside the initial area
                height: '100%',
                touchAction: 'none', // Important to prevent browser gestures
                zIndex: 20,
                pointerEvents: 'auto' // Allow touches
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            {/* Fixed Joystick Container */}
            <div style={{
                position: 'absolute',
                bottom: `${fixedBottom}px`,
                left: `${fixedLeft}px`,
                width: baseSize,
                height: baseSize,
                pointerEvents: 'none', // Let parent handle events
            }}>
                {/* Outer Circle (Boundary) */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '2px solid rgba(255, 255, 255, 0.5)',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    }}
                />

                {/* Inner Circle (Thumb) */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${current.x}px), calc(-50% + ${current.y}px))`,
                        width: handleSize,
                        height: handleSize,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                        transition: active ? 'none' : 'transform 0.1s ease-out' // Snap back when released
                    }}
                />
            </div>
        </div>
    )
}
