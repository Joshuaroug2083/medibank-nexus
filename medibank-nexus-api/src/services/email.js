/**
 * Email Service — nodemailer wrapper
 *
 * Configuration (add to .env):
 *   EMAIL_HOST=smtp.gmail.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=noreply@medibanknexus.com
 *   EMAIL_PASS=your_app_password
 *   EMAIL_FROM="MediBank Nexus <noreply@medibanknexus.com>"
 *
 * For SendGrid:
 *   EMAIL_HOST=smtp.sendgrid.net
 *   EMAIL_PORT=587
 *   EMAIL_USER=apikey
 *   EMAIL_PASS=SG.xxxxxxxx
 *
 * For Termii (SMS):
 *   TERMII_API_KEY=your_key
 *   TERMII_SENDER_ID=MediNexus
 */

/* Dynamic import of nodemailer — graceful if not installed */
async function getTransporter() {
  try {
    const nodemailer = (await import('nodemailer')).default;
    return nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   parseInt(process.env.EMAIL_PORT ?? '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } catch {
    return null;
  }
}

/**
 * Send an email.
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(`[Email] SMTP not configured — would have sent to ${to}: "${subject}"`);
    return { skipped: true };
  }

  const transporter = await getTransporter();
  if (!transporter) {
    console.warn('[Email] nodemailer not installed. Run: npm install nodemailer');
    return { skipped: true };
  }

  const info = await transporter.sendMail({
    from:    process.env.EMAIL_FROM ?? `"MediBank Nexus" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text:    text ?? html.replace(/<[^>]+>/g, ''),
  });

  console.log(`[Email] Sent to ${to}: ${info.messageId}`);
  return info;
}

/**
 * Send an SMS via Termii.
 * @param {{ to: string, message: string }} opts
 */
export async function sendSMS({ to, message }) {
  const apiKey   = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID ?? 'MediNexus';

  if (!apiKey) {
    console.warn(`[SMS] Termii not configured — would have sent to ${to}: "${message}"`);
    return { skipped: true };
  }

  const res = await fetch('https://api.ng.termii.com/api/sms/send', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      from:     senderId,
      sms:      message,
      type:     'plain',
      channel:  'generic',
      api_key:  apiKey,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[SMS] Termii error:', data);
    throw new Error(data?.message ?? 'SMS send failed');
  }

  console.log(`[SMS] Sent to ${to} via Termii. Balance: ${data?.balance}`);
  return data;
}
