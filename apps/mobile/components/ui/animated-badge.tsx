interface AnimatedBadgeProps {
  text: string
  type?: "success" | "warning" | "error" | "info"
  animated?: boolean
}

export function AnimatedBadge({ text, type = "info", animated = false }: AnimatedBadgeProps) {
  const typeStyles = {
    success: "bg-green-500/20 text-green-700 border border-green-500/30",
    warning: "bg-orange-500/20 text-orange-700 border border-orange-500/30",
    error: "bg-red-500/20 text-red-700 border border-red-500/30",
    info: "bg-blue-500/20 text-blue-700 border border-blue-500/30",
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${typeStyles[type]} ${
        animated ? "animate-pulse" : ""
      } transition-all duration-300`}
    >
      {text}
    </span>
  )
}
