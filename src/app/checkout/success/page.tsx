import React, { Suspense } from 'react';
import SuccessClient from '@/components/SuccessClient';

export default function SuccessPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-background p-8">
            <Suspense fallback={<div className="max-w-2xl w-full p-8">Loading…</div>}>
                <SuccessClient />
            </Suspense>
        </main>
    );
}
