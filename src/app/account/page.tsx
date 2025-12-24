"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderItem {
    _id: string;
    items: { name: string; qty: number; price: number }[];
    total: number;
    status: string;
    createdAt: string;
}

export default function AccountPage() {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/orders/me', { credentials: 'include' });
                if (res.status === 401) {
                    setError('Unauthorized. Please log in.');
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setOrders(data || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;
    if (error) return (
        <div className="p-8">
            <div className="text-red-600 mb-4">{error}</div>
            <button onClick={() => router.push('/login')} className="px-4 py-2 bg-black text-white">Go to Login</button>
        </div>
    );

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-2xl font-bold mb-6">My Orders</h1>
            {orders.length === 0 && <div>No orders found.</div>}

            <div className="space-y-4">
                {orders.map(order => (
                    <div key={order._id} className="border p-4">
                        <div className="flex justify-between mb-2">
                            <div>
                                <div className="text-sm text-gray-500">Order ID: {order._id}</div>
                                <div className="font-semibold">{order.items.length} items — {order.items.reduce((s, it) => s + it.qty, 0)} qty</div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">Total: RS {order.total}</div>
                                <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
                                <div className="text-sm mt-2">Status: <span className="font-semibold">{order.status}</span></div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-700 mt-2">
                            {order.items.map((it, i) => (
                                <div key={i}>{it.name} x{it.qty} — RS {it.price}</div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
