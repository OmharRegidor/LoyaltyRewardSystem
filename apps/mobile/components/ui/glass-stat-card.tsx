import type React from "react"
interface GlassStatCardProps {
  value: string | number
  label: string
  color?: string
  icon?: React.ReactNode
}

export function GlassStatCard({ value, label, color = "text-primary", icon }: GlassStatCardProps) {
  return (
    <div className="backdrop-blur-md bg-white/40 border border-white/30 p-4 rounded-xl hover:bg-white/60 hover:border-white/50 transition-all duration-300 hover:shadow-lg hover:scale-105 text-center">
      {icon && <div className="flex justify-center mb-2">{icon}</div>}
      <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
