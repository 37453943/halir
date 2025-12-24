export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from '@/lib/db';
import Order from '@/models/Orders';
import { verifyTokenFromReq } from '@/lib/auth';
import { reqLogger } from '@/lib/logger';
import { generateRequestId } from '@/lib/requestId';

export async function GET(req: Request) {
    const reqId = req.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);

    await dbConnect();
    try {
        const payload: any = verifyTokenFromReq(req);
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = payload.id;
        log.debug({ userId }, 'GET /api/orders/me called');
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
        return NextResponse.json(orders, { status: 200 });
    } catch (e) {
        log.error({ err: e }, 'Failed to fetch user orders');
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
