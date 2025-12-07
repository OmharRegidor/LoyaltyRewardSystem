import type React from "react"
import { View, StyleSheet, type ViewStyle } from "react-native"
import { BlurView } from "expo-blur"

interface GlassCardProps {
  children: React.ReactNode
  style?: ViewStyle
  intensity?: number
}

export default function GlassCard({ children, style, intensity = 80 }: GlassCardProps) {
  return (
    <BlurView intensity={intensity} style={[styles.container, style]}>
      <View style={styles.glass}>{children}</View>
    </BlurView>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 16,
  },
  glass: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
})
