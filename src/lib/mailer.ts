import nodemailer from 'nodemailer';
import logger from '@/lib/logger';

interface MailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

let transporter: any = null;

function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
        // No SMTP configured — we'll fallback to a logger
        transporter = null;
        return null;
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: { user, pass },
    });

    return transporter;
}

async function sendWithRetries(options: MailOptions, attempts = 3, backoff = 300) {
    for (let i = 0; i < attempts; i++) {
        try {
            const t = getTransporter();
            const from = process.env.SMTP_FROM || process.env.ADMIN_EMAIL || 'no-reply@example.com';

            if (!t) {
                logger.info({ simulated: true, from, to: options.to, subject: options.subject }, 'EMAIL (simulated)');
                return { simulated: true };
            }

            // verify once
            if (!transporter.__verified) {
                try {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    await transporter.verify();
                    transporter.__verified = true;
                } catch (err) {
                    logger.warn({ err }, 'Mail transporter verification failed; continuing and will attempt send');
                }
            }

            const info = await t.sendMail({ from, to: options.to, subject: options.subject, text: options.text, html: options.html });
            logger.info({ to: options.to, messageId: info.messageId }, 'Email sent');
            return info;
        } catch (err: any) {
            logger.error({ err, attempt: i + 1 }, 'Failed to send email, will retry');
            if (i + 1 < attempts) await new Promise((r) => setTimeout(r, backoff * Math.pow(2, i)));
            else throw err;
        }
    }
}

export async function sendMail(opts: MailOptions) {
    return sendWithRetries(opts, 3, 300);
}
