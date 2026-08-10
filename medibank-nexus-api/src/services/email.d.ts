/**
 * Send an email.
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 */
export function sendEmail({ to, subject, html, text }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
}): Promise<any>;
/**
 * Send an SMS via Termii.
 * @param {{ to: string, message: string }} opts
 */
export function sendSMS({ to, message }: {
    to: string;
    message: string;
}): Promise<any>;
