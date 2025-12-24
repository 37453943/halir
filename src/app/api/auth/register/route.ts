// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/Users";
import { verifyTokenFromReq, signToken, createAuthCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validators/auth';
import { generateRequestId } from '@/lib/requestId';
import { reqLogger } from '@/lib/logger';
import { jsonResponse } from '@/lib/response';

export async function POST(req: Request) {
    const reqId = req.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);
    log.debug('auth.register called');

    await dbConnect();
    // Validate request
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return jsonResponse({ error: 'Invalid register payload', details: parsed.error.format() }, 400, reqId);
    const { name, email, password, role } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) return jsonResponse({ error: "User already exists" }, 400, reqId);

    const hashedPassword = await bcrypt.hash(password, 10);

    // Prevent callers from creating admin accounts unless the request is from an authenticated admin
    let roleToSet: any = undefined;
    if (role === 'admin') {
        try {
            const payload: any = verifyTokenFromReq(req);
            if (payload && payload.role === 'admin') roleToSet = 'admin';
        } catch (e) {
            // ignore — not allowed
            roleToSet = undefined;
        }
    }

    const newUser = await User.create({ name, email, password: hashedPassword, role: roleToSet });

    // Do not return password in response
    const userToReturn = { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role };

    // Sign a token so registering also logs the user in
    const token = signToken({ id: newUser._id, role: newUser.role });

    // Set cookie and return response
    const cookie = createAuthCookie(token);
    const res = jsonResponse({ message: "Account created successfully", user: userToReturn, token, role: newUser.role }, 201, reqId);
    res.headers.set('Set-Cookie', cookie);
    log.info({ userId: String(newUser._id) }, 'User registered');
    return res;
}
