import jwt from 'jsonwebtoken';
import { env } from './env';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function signToken(payload: any) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, env.JWT_SECRET) as any;
    } catch (e) {
        return null;
    }
}

export function createAuthCookie(token: string) {
    const secure = env.NODE_ENV === 'production';
    const parts = [`${COOKIE_NAME}=${encodeURIComponent(token)}`, `Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=${COOKIE_MAX_AGE}`];
    if (secure) parts.push('Secure');
    return parts.join('; ');
}

export function clearAuthCookie() {
    const secure = env.NODE_ENV === 'production';
    const parts = [`${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`];
    if (secure) parts.push('Secure');
    return parts.join('; ');
}

function getTokenFromCookieHeader(cookieHeader?: string | null) {
    if (!cookieHeader) return null;
    const parts = cookieHeader.split(';').map(p => p.trim());
    for (const p of parts) {
        if (p.startsWith(`${COOKIE_NAME}=`)) {
            return decodeURIComponent(p.substring((`${COOKIE_NAME}=`).length));
        }
    }
    return null;
}

export function verifyTokenFromReq(req: Request) {
    const auth = req.headers.get('authorization');
    if (auth) {
        const token = auth.replace(/^Bearer\s+/i, '');
        const payload = verifyToken(token);
        if (payload) return payload;
    }
    const cookieHeader = req.headers.get('cookie');
    const tokenFromCookie = getTokenFromCookieHeader(cookieHeader);
    if (!tokenFromCookie) return null;
    return verifyToken(tokenFromCookie);
}
