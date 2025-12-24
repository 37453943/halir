import { NextResponse } from 'next/server';

export function jsonResponse(body: any, status = 200, reqId?: string) {
    const res = NextResponse.json(body, { status });
    if (reqId) res.headers.set('X-Request-Id', reqId);
    return res;
}
