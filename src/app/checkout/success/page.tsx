"use client";

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SuccessPage() {
    const search = useSearchParams();
    const router = useRouter();
    const orderId = search.get('orderId');

    return (
        <main className="min-h-screen flex items-center justify-center bg-background p-8">
            <div className="max-w-2xl w-full bg-white p-8 rounded shadow text-center">
                <h1 className="text-2xl font-bold mb-4">Thank you for your order!</h1>
                {orderId ? (
                    <p className="mb-4">Your order <span className="font-mono">{orderId}</span> has been received. You will receive a confirmation email shortly.</p>
                ) : (
                    <p className="mb-4">Your order has been received. You will receive a confirmation email shortly.</p>
                )}

                <div className="flex justify-center gap-4 mt-6">
                    <button onClick={() => router.push('/')} className="px-4 py-2 bg-black text-white">Continue shopping</button>
                    <button onClick={() => router.push('/account')} className="px-4 py-2 border">View my orders</button>
                </div>
            </div>
        </main>
    );
}
