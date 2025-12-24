export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from '@/lib/db';
import Order from '@/models/Orders';
import Product from '@/models/Product';
import mongoose from 'mongoose';
import { updateOrderStatusSchema } from '@/lib/validators/orders';

import { verifyTokenFromReq } from '@/lib/auth';
import { generateRequestId } from '@/lib/requestId';
import { reqLogger } from '@/lib/logger';
import { jsonResponse } from '@/lib/response';

async function getUserFromReq(req: Request) {
    try {
        const payload: any = verifyTokenFromReq(req);
        return payload;
    } catch (e) {
        return null;
    }
}

export async function PATCH(req: Request, context: { params: any }) {
    await dbConnect();
    const userPayload = await getUserFromReq(req);
    if (!userPayload || userPayload.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // `params` may be a Promise in Next.js; unwrap it explicitly
    const reqId = req.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);

    const params = await context.params;
    const id = params?.id;
    const body = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) return jsonResponse({ error: 'Invalid payload', details: parsed.error.format() }, 400, reqId);
    const { status } = parsed.data;
    // Only allow pending <-> shipped state transitions from the admin UI
    if (status && !['pending', 'shipped', 'cancelled', 'paid', 'completed'].includes(status)) return jsonResponse({ error: 'Invalid status' }, 400, reqId);

    // Diagnostic logging to help debug missing orders
    log.debug({ rawId: id, status, userId: userPayload?.id }, 'PATCH /api/orders/:id called');

    // Normalize id candidates and attempt lookup by each candidate until one succeeds
    const idCandidates: string[] = [];
    try {
        const raw = String(id);
        idCandidates.push(raw);

        // 1) decoded URI component (in case client encoded a JSON string)
        try {
            const decoded = decodeURIComponent(raw);
            if (decoded !== raw) idCandidates.push(decoded);
        } catch (e) {
            // ignore decode errors
        }

        // 2) if the string is JSON (e.g., {"$oid":"..."}) try parsing and extracting common keys
        if (raw.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.$oid) idCandidates.push(String(parsed.$oid));
                    if (parsed.$id) idCandidates.push(String(parsed.$id));
                    if (typeof parsed.toString === 'function') idCandidates.push(parsed.toString());
                }
            } catch (e) {
                // ignore JSON parse errors
            }
        }

        // 3) if raw contains quotes/brace characters, attempt to strip non-hex characters
        const hex = raw.replace(/[^0-9a-fA-F]/g, '');
        if (hex.length === 24 && hex !== raw) idCandidates.push(hex);
    } catch (e) {
        log.error({ err: e }, 'Error preparing id candidates');
    }

    // Deduplicate candidates preserving order
    const uniqueCandidates = Array.from(new Set(idCandidates)).filter(Boolean);
    let order = null as any;

    for (const candidate of uniqueCandidates) {
        try {
            if (mongoose.Types.ObjectId.isValid(candidate)) {
                order = await Order.findById(candidate);
                log.debug({ candidate, found: !!order }, 'Lookup by candidate');
                if (order) break;
            }
        } catch (e) {
            log.error({ candidate, err: e }, 'Error looking up candidate');
        }
    }

    if (!order) {
        log.warn({ candidates: uniqueCandidates }, 'Order not found after attempts for id candidates');
        return jsonResponse({ error: 'Order not found' }, 404, reqId);
    }

    // If cancelling, attempt to restock
    if (status === 'cancelled' && order.status !== 'cancelled') {
        for (const it of order.items) {
            if (it.productId) {
                await Product.findByIdAndUpdate(it.productId, { $inc: { quantity: it.qty } });
            }
        }
    }

    order.status = status as any;
    await order.save();

    return jsonResponse({ message: 'Order updated' }, 200, reqId);
}
