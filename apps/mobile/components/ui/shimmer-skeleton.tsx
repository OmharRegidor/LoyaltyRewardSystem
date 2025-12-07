"use client"

interface ShimmerSkeletonProps {
  width?: number | string
  height?: number
  count?: number
  borderRadius?: number
}

export function ShimmerSkeleton({ width = "100%", height = 16, count = 1, borderRadius = 8 }: ShimmerSkeletonProps) {
  const skeletons = Array.from({ length: count })

  return (
    <div className="space-y-3">
      {skeletons.map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"
          style={{
            width,
            height,
            borderRadius,
          }}
        />
      ))}
    </div>
  )
}
