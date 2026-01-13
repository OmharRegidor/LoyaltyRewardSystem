// apps/web/app/api/qr/[code]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

// ============================================
// TYPES
// ============================================

interface RouteParams {
  params: Promise<{ code: string }>;
}

// ============================================
// GET: Generate QR Code Image
// ============================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const decodedCode = decodeURIComponent(code);

    // Validate QR code format
    if (!decodedCode.startsWith('loyaltyhub://')) {
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      );
    }

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(decodedCode, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Return PNG image
    return new NextResponse(qrBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
