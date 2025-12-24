import { jsonResponse } from '@/lib/response';
import { sendMail } from '@/lib/mailer';
import { generateRequestId } from '@/lib/requestId';
import { reqLogger } from '@/lib/logger';

export async function POST(req: Request) {
    const reqId = req.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);

    try {
        const body = await req.json();
        const to = body?.to || process.env.ADMIN_EMAIL;
        if (!to) return jsonResponse({ error: 'Missing destination email in body or ADMIN_EMAIL env' }, 400, reqId);

        await sendMail({ to, subject: 'Test email from app', text: 'This is a test email from your application' });
        log.info({ to }, 'Test email sent');
        return jsonResponse({ ok: true }, 200, reqId);
    } catch (e: any) {
        log.error({ err: e }, 'Failed to send test email');
        return jsonResponse({ error: e.message || 'Failed to send test email' }, 500, reqId);
    }
}