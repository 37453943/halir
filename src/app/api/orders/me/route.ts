export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from '@/lib/db';
import Order from '@/models/Orders';
import jwt from 'jsonwebtoken';

async function getUserFromReq(req: Request) {
    try {
        const auth = req.headers.get('authorization');
        if (!auth) return null;
        const token = auth.replace(/^Bearer\s+/i, '');
        const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
        return payload; // { id, role }
    } catch (e) {
        return null;
    }
}

export async function GET(req: Request) {
    await dbConnect();
    const userPayload = await getUserFromReq(req);
    if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orders = await Order.find({ user: userPayload.id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(orders, { status: 200 });
}
