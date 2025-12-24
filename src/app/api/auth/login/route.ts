export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/Users";
import { signToken, createAuthCookie } from '@/lib/auth';
import { reqLogger } from '@/lib/logger';
import { generateRequestId } from '@/lib/requestId';
import { jsonResponse } from '@/lib/response';
import { loginSchema } from '@/lib/validators/auth';

export async function POST(req: Request) {
    const reqId = req.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);
    log.debug('auth.login called');

    await dbConnect();
    const body = await req.json();

    // Validate request
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return jsonResponse({ error: 'Invalid login payload', details: parsed.error.format() }, 400, reqId);
    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) return jsonResponse({ error: "Invalid credentials" }, 401, reqId);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return jsonResponse({ error: "Invalid credentials" }, 401, reqId);

    const token = signToken({ id: user._id, role: user.role });

    // Set HttpOnly cookie
    const cookie = createAuthCookie(token);
    const res = jsonResponse({ token, role: user.role }, 200, reqId);
    res.headers.set('Set-Cookie', cookie);
    log.info({ userId: String(user._id) }, 'user logged in');
    return res;
}
