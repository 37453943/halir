import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateRequestId } from './src/lib/requestId';

// Simple middleware to ensure every incoming API request has an X-Request-Id header
export function middleware(req: NextRequest) {
    const existing = req.headers.get('x-request-id');
    const reqId = existing || generateRequestId();
    const res = NextResponse.next();
    res.headers.set('x-request-id', reqId);
    return res;
}

export const config = {
    matcher: ['/api/:path*'],
};