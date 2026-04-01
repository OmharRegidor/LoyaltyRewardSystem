// apps/web/lib/qr-code.ts

import QRCode from 'qrcode';
import crypto from 'crypto';

// ============================================
// CONSTANTS
// ============================================

const QR_CODE_BASE_OPTIONS = {
  errorCorrectionLevel: 'H' as const,
  margin: 2,
  width: 300,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

const QR_CODE_HIGH_RES_WIDTH = 600;

// ============================================
// QR CODE GENERATION (SERVER-ONLY)
// ============================================

/**
 * Generate a unique QR token
 * Uses cryptographically secure random bytes
 */
export function generateQRToken(): string {
  const bytes = crypto.randomBytes(12);
  return bytes.toString('base64url');
}

/**
 * Generate QR code URL for a customer
 * Format: NoxaLoyalty://customer/{token}
 */
export function generateQRCodeUrl(token: string): string {
  return `NoxaLoyalty://customer/${token}`;
}

/**
 * Generate QR code as base64 data URL
 */
export async function generateQRCodeDataUrl(
  content: string,
  highRes: boolean = false,
): Promise<string> {
  const options: QRCode.QRCodeToDataURLOptions = {
    ...QR_CODE_BASE_OPTIONS,
    type: 'image/png',
    width: highRes ? QR_CODE_HIGH_RES_WIDTH : QR_CODE_BASE_OPTIONS.width,
  };
  return QRCode.toDataURL(content, options);
}

/**
 * Generate QR code as buffer (for email attachments)
 */
export async function generateQRCodeBuffer(content: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const options: QRCode.QRCodeToBufferOptions = {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: QR_CODE_HIGH_RES_WIDTH,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    };

    QRCode.toBuffer(content, options, (err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });
}

// ============================================
// BUSINESS JOIN QR CODE
// ============================================

/**
 * Generate a URL for the business join page
 * Customers scan this QR to self-register
 */
export function generateBusinessJoinQRCodeUrl(joinCode: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/join/${joinCode}`;
}

/**
 * Extract customer ID from QR code URL
 * Input: NoxaLoyalty://customer/{token}
 * Output: {token}
 */
export function extractQRToken(qrCodeUrl: string): string | null {
  const prefix = 'NoxaLoyalty://customer/';
  if (!qrCodeUrl.startsWith(prefix)) {
    return null;
  }
  return qrCodeUrl.slice(prefix.length);
}
