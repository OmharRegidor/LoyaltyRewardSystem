"use client"

import { useState } from "react"

interface GlassButtonProps {
  label: string
  onClick: () => void
  variant?: "primary" | "secondary" | "danger"
  disabled?: boolean
  fullWidth?: boolean
}

export function GlassButton({
  label,
  onClick,
  variant = "primary",
  disabled = false,
  fullWidth = false,
}: GlassButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const variantStyles = {
    primary:
      "backdrop-blur-sm bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90",
    secondary:
      "backdrop-blur-sm bg-white/40 border border-white/30 text-foreground hover:bg-white/60 hover:border-white/50",
    danger: "backdrop-blur-sm bg-red-500/40 border border-red-500/30 text-red-600 hover:bg-red-500/60",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${variantStyles[variant]} ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:scale-105 active:scale-95"} ${
        isHovered ? "shadow-lg" : ""
      }`}
    >
      {label}
    </button>
  )
}
