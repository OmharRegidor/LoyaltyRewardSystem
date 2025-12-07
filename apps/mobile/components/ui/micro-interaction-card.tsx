"use client"

import type React from "react"

import { useState } from "react"

interface MicroInteractionCardProps {
  children: React.ReactNode
  onClick?: () => void
  hoverable?: boolean
  className?: string
}

export function MicroInteractionCard({
  children,
  onClick,
  hoverable = true,
  className = "",
}: MicroInteractionCardProps) {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`backdrop-blur-sm bg-white/40 border border-white/30 rounded-xl transition-all duration-300 ${
        hoverable ? "hover:bg-white/60 hover:border-white/50 hover:shadow-lg hover:scale-102 cursor-pointer" : ""
      } ${isPressed ? "scale-95" : ""} ${className}`}
    >
      {children}
    </div>
  )
}
