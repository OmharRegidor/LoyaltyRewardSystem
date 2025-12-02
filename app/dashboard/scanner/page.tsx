"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { QRScanner } from "@/components/scanner/qr-scanner"
import { ScannerBottomSheet } from "@/components/scanner/bottom-sheet"
import { useState } from "react"

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<any>(null)

  const handleScanResult = (result: string) => {
    // Simulate scanning a customer QR code
    setScanResult({
      customerId: result,
      customerName: "Maria Santos",
      currentPoints: 3250,
      status: "success",
    })
  }

  return (
    <DashboardLayout>
      <div className="h-full">
        <QRScanner onScan={handleScanResult} />
        {scanResult && (
          <ScannerBottomSheet
            customer={scanResult}
            onClose={() => setScanResult(null)}
            onConfirm={() => {
              setScanResult(null)
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
