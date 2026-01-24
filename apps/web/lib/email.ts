// apps/web/lib/email.ts

import { Resend } from 'resend';

// ============================================
// RESEND CLIENT
// ============================================

// Lazy initialization - only create client when needed
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

// ============================================
// TYPES
// ============================================

interface SendWelcomeEmailParams {
  to: string;
  customerName: string;
  businessName: string;
  businessLogo?: string | null;
  qrCodeContent: string; // The QR code content (loyaltyhub://customer/xxx)
  cardViewUrl: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

function generateWelcomeEmailHtml(params: SendWelcomeEmailParams): string {
  const {
    customerName,
    businessName,
    businessLogo,
    qrCodeContent,
    cardViewUrl,
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const qrCodeImageUrl = `${appUrl}/api/qr/${encodeURIComponent(qrCodeContent)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${businessName} Loyalty Program</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%); padding: 32px 40px; text-align: center;">
              ${
                businessLogo
                  ? `<img src="${businessLogo}" alt="${businessName}" style="max-height: 60px; margin-bottom: 16px;" />`
                  : `<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${businessName}</h1>`
              }
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Loyalty Rewards Program</p>
            </td>
          </tr>
          
          <!-- QR Code Section -->
          <tr>
            <td style="padding: 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Membership</p>
              <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 24px; font-weight: 700;">${customerName}</h2>
              
              <!-- QR Code -->
              <div style="display: inline-block; padding: 16px; background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px;">
                <img src="${qrCodeImageUrl}" alt="Your QR Code" width="180" height="180" style="width: 180px; height: 180px; display: block;" />
              </div>
              
              <!-- View Card Button -->
              <div style="margin-top: 24px;">
                <a href="${cardViewUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                  View Your Card
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Message Section -->
          <tr>
            <td style="padding: 40px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                Hello ${customerName.split(' ')[0]},
              </h3>
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Welcome to the <strong>${businessName}</strong> loyalty rewards program!
              </p>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; color: #111827; font-size: 14px; font-weight: 600;">How to earn points:</p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                  <li><strong>Show your QR code</strong> at checkout to earn points on every purchase.</li>
                  <li><strong>Earn rewards faster</strong> by reaching higher membership tiers.</li>
                  <li><strong>Download the LoyaltyHub app</strong> for the best experience.</li>
                </ul>
              </div>
              
              <p style="margin: 24px 0 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                Click "View Your Card" above to see your digital loyalty card and download it as a PDF.
              </p>
            </td>
          </tr>
          
          <!-- App Download CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #86efac; border-radius: 12px; padding: 24px;">
                <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-weight: 600;">
                  📱 Get the LoyaltyHub App
                </p>
                <p style="margin: 0 0 16px 0; color: #15803d; font-size: 13px;">
                  Track points in real-time, browse rewards, and never miss a deal!
                </p>
                <a href="https://loyaltyhub.app/download" target="_blank" style="display: inline-block; padding: 10px 24px; background-color: #22c55e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">
                  Download Now
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                Powered by <strong style="color: #6366f1;">LoyaltyHub</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                This email was sent by ${businessName}. If you didn't sign up for this, please ignore this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateWelcomeEmailText(params: SendWelcomeEmailParams): string {
  const { customerName, businessName, cardViewUrl } = params;

  return `
Welcome to ${businessName} Loyalty Program!

Hello ${customerName},

Welcome to the ${businessName} loyalty rewards program!

To view your membership card and QR code, visit:
${cardViewUrl}

How to earn points:
- Show your QR code at checkout to earn points on every purchase
- Earn rewards faster by reaching higher membership tiers
- Download the LoyaltyHub app for real-time point tracking (Soon available on iOS and Android)

Download the LoyaltyHub app: https://loyaltyhub.app/download

---
Powered by LoyaltyHub
This email was sent by ${businessName}.
  `.trim();
}

// ============================================
// SEND EMAIL FUNCTIONS
// ============================================

export async function sendWelcomeEmail(
  params: SendWelcomeEmailParams,
): Promise<EmailResult> {
  try {
    const { to, businessName } = params;
    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@noxaloyalty.com',
      to: [to],
      subject: `Welcome to ${businessName} Loyalty Rewards! 🎉`,
      html: generateWelcomeEmailHtml(params),
      text: generateWelcomeEmailText(params),
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Send email catch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
