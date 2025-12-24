import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
    const res = NextResponse.json({ message: 'Logged out' }, { status: 200 });
    res.headers.set('Set-Cookie', clearAuthCookie());
    return res;
}
