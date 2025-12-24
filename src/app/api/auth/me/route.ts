export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from '@/lib/db';
import User from '@/models/Users';
import { verifyTokenFromReq } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const payload: any = verifyTokenFromReq(req);
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = await User.findById(payload.id).select('-password').lean();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ user }, { status: 200 });
    } catch (e) {
        logger.error({ e }, 'auth/me failed');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}