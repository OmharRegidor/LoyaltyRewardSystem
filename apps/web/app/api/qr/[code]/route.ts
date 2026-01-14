// apps/web/app/api/qr/[code]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const decodedCode = decodeURIComponent(code);

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
    return new NextResponse(new Uint8Array(qrBuffer), {
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
