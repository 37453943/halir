import { NextResponse } from 'next/server';

// Logout endpoint disabled — sessions are session-scoped and will clear when browser closes.
export async function POST() {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
