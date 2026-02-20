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
  qrCodeContent: string; // The QR code content (NoxaLoyalty://customer/xxx)
  cardViewUrl: string;
}

interface SendVerificationEmailParams {
  to: string;
  code: string;
  businessName: string;
}

interface SendCustomerInviteEmailParams {
  to: string;
  businessName: string;
  joinUrl: string;
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
            <td style="background: linear-gradient(135deg, #5A171E 0%, #751E26 50%, #8B2A33 100%); padding: 32px 40px; text-align: center;">
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
                <a href="${cardViewUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #751E26 0%, #8B2A33 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(117, 30, 38, 0.4);">
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
                  <li><strong>Download the NoxaLoyalty app</strong> for the best experience.</li>
                </ul>
              </div>
              
            </td>
          </tr>
          
          <!-- App Download CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <div style="background: linear-gradient(135deg, #FFF9E0 0%, #FEF3C7 100%); border: 1px solid #FDDE54; border-radius: 12px; padding: 24px;">
                <p style="margin: 0 0 8px 0; color: #5A171E; font-size: 14px; font-weight: 600;">
                  📱 Get the NoxaLoyalty App
                </p>
                <p style="margin: 0 0 16px 0; color: #751E26; font-size: 13px;">
                  Track points in real-time, browse rewards, and never miss a deal!
                </p>
                <a href="https://NoxaLoyalty.app/download" target="_blank" style="display: inline-block; padding: 10px 24px; background-color: #751E26; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">
                  Download Now
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                Powered by <strong style="color: #751E26;">NoxaLoyalty</strong>
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
- Download the NoxaLoyalty app for real-time point tracking (Soon available on iOS and Android)

Download the NoxaLoyalty app: https://NoxaLoyalty.app/download

---
Powered by NoxaLoyalty
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

// ============================================
// VERIFICATION EMAIL
// ============================================

export async function sendVerificationEmail(
  params: SendVerificationEmailParams,
): Promise<EmailResult> {
  try {
    const { to, code, businessName } = params;
    const resend = getResend();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #5A171E 0%, #751E26 50%, #8B2A33 100%); padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">${businessName}</h1>
              <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Email Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center;">
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Enter this code to verify your email and join the <strong>${businessName}</strong> loyalty program:
              </p>
              <div style="display: inline-block; padding: 16px 32px; background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 12px; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827; font-family: monospace;">${code}</span>
              </div>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                Powered by <strong style="color: #751E26;">NoxaLoyalty</strong> &mdash; If you didn't request this, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    const text = `Your verification code for ${businessName}: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nPowered by NoxaLoyalty`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@noxaloyalty.com',
      to: [to],
      subject: `${code} - Your ${businessName} verification code`,
      html,
      text,
    });

    if (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Send verification email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// CUSTOMER INVITE EMAIL
// ============================================

export async function sendCustomerInviteEmail(
  params: SendCustomerInviteEmailParams,
): Promise<EmailResult> {
  try {
    const { to, businessName, joinUrl } = params;
    const resend = getResend();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #5A171E 0%, #751E26 50%, #8B2A33 100%); padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">${businessName}</h1>
              <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Loyalty Rewards Program</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #111827; font-size: 20px; font-weight: 700;">You're Invited!</p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                <strong>${businessName}</strong> has invited you to join their loyalty rewards program. Earn points on every purchase and redeem them for exclusive rewards!
              </p>
              <a href="${joinUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #751E26 0%, #8B2A33 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(117, 30, 38, 0.4);">
                Join Now
              </a>
              <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 13px;">
                Or copy this link: <a href="${joinUrl}" style="color: #751E26;">${joinUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                Powered by <strong style="color: #751E26;">NoxaLoyalty</strong> &mdash; If you didn't expect this, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    const text = `You're invited to join ${businessName}'s loyalty rewards program!\n\nJoin now: ${joinUrl}\n\nEarn points on every purchase and redeem them for exclusive rewards.\n\nPowered by NoxaLoyalty`;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@noxaloyalty.com',
      to: [to],
      subject: `You're invited to ${businessName}'s rewards program!`,
      html,
      text,
    });

    if (error) {
      console.error('Resend invite error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Send invite email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
