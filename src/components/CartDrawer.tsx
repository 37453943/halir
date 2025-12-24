"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import logger from '@/lib/clientLogger';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

function CheckoutButton({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    return (
        <button onClick={() => { onClose(); router.push('/checkout'); }} className="w-full bg-btnn text-white px-5 py-5 font-bold">CHECKOUT</button>
    );
}

interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
    image?: string;
    size?: string;
    variant?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
    const [items, setItems] = useState<CartItem[]>(() => {
        try {
            const raw = sessionStorage.getItem("cart");
            if (!raw) return [];
            const parsed = JSON.parse(raw) as CartItem[];
            return parsed || [];
        } catch {
            return [];
        }
    });
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Show prices in Pakistani Rupees (RS) as integers
    const formatPrice = (v: number) => `RS ${v.toFixed(0)}`;

    const itemsRef = useRef<CartItem[]>([]);

    // Keep a ref of latest items to avoid capturing stale closures inside event handlers
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // Load cart from session storage (declared before effects so it can be used safely)
    const loadFromStorage = useCallback(() => {
        try {
            const raw = sessionStorage.getItem("cart");
            if (!raw) {
                if ((itemsRef.current || []).length !== 0) setItems([]);
                return;
            }
            const parsed = JSON.parse(raw) as CartItem[];
            // Only update state when parsed differs from current items to avoid re-entrant update loops
            try {
                const currentJson = JSON.stringify(itemsRef.current || []);
                const parsedJson = JSON.stringify(parsed || []);
                if (currentJson !== parsedJson) {
                    setItems(parsed || []);
                } else {
                    logger.debug('loadFromStorage: no change in cart, skipping setItems');
                }
            } catch {
                // Fallback: if stringify comparison fails, set items conservatively
                setItems(parsed || []);
            }
        } catch (e) {
            logger.error("Failed to parse cart from storage", e);
            if ((itemsRef.current || []).length !== 0) setItems([]);
        }
    }, []);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === "cart") loadFromStorage();
        };
        // When cart changes in the same tab we use custom events to notify components.
        const onCartUpdate = () => {
            logger.debug('CartDrawer received cart:update');
            loadFromStorage();
        };
        const onCartOpen = () => {
            logger.debug('CartDrawer received cart:open');
            loadFromStorage();
        };

        window.addEventListener("storage", onStorage);
        window.addEventListener("cart:update", onCartUpdate as EventListener);
        window.addEventListener("cart:open", onCartOpen as EventListener);

        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("cart:update", onCartUpdate as EventListener);
            window.removeEventListener("cart:open", onCartOpen as EventListener);
        };
    }, [loadFromStorage]);

    useEffect(() => {
        // broadcast changes so header or other parts can react
        logger.debug('CartDrawer items changed', items);
        window.dispatchEvent(new CustomEvent("cart:update", { detail: (items || []).length }));
        // persist to session storage (clears when browser/tab closes)
        sessionStorage.setItem("cart", JSON.stringify(items));
    }, [items]);


    const changeQty = (id: string, delta: number) => {
        setItems(prev => {
            const newItems = prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
            try {
                sessionStorage.setItem('cart', JSON.stringify(newItems));
                window.dispatchEvent(new CustomEvent('cart:update', { detail: newItems.length }));
            } catch (err) {
                logger.error('Failed to persist cart after qty change', err);
            }
            logger.debug('CartDrawer.changeQty result', { id, delta, newItems });
            return newItems;
        });
    };

    const removeItem = (id: string) => {
        setItems(prev => {
            const newItems = prev.filter(i => i.id !== id);
            try {
                sessionStorage.setItem('cart', JSON.stringify(newItems));
                window.dispatchEvent(new CustomEvent('cart:update', { detail: newItems.length }));
            } catch (err) {
                logger.error('Failed to persist cart after removeItem', err);
            }
            logger.debug('CartDrawer.removeItem result', { id, newItemsLength: newItems.length });
            return newItems;
        });
    };


    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-40" onClick={onClose}>
            <div className="absolute right-0 top-4 w-[460px] z-50" onClick={(e) => e.stopPropagation()} ref={containerRef}>
                <div className="bg-[#F7F7F5] border-2 border-gray-300 ">
                    <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 p-4">
                        <h3 className="text-lg font-bold uppercase">MY CART</h3>
                        <div className="flex items-center gap-2">

                            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center text-gray-500 mt-4 p-5">Your cart is empty.</div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {items.map(item => (
                                <div key={item.id} className="flex items-start gap-3 border-b-2 border-gray-300 p-4">
                                    <Image src={item.image || '/images/placeholder.png'} alt={item.name || ''} width={96} height={96} className="w-24 h-24 object-cover rounded" />

                                    <div className="flex-1">
                                        <div className="font-bold text-lg uppercase">{item.name}</div>
                                        <div className="mt-2 text-sm text-gray-700">Price: <span className="font-semibold">{formatPrice(item.price)}</span></div>
                                        <div className="mt-1 text-sm text-gray-700">Size: <span className="font-semibold">{item.size || item.variant || '—'}</span></div>
                                        <div className="mt-1 flex text-sm text-gray-700 items-center">
                                            Quantity:
                                            <button type="button" onClick={(e) => { e.stopPropagation(); changeQty(item.id, -1); }} className="px-1 font-semibold">-</button>
                                            <div className="px-2 font-semibold">{item.qty}</div>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); changeQty(item.id, 1); }} className="px-1 font-semibold">+</button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="text-red-800 hover:text-red-1000 text-sm mt-1">Remove</button>
                                    </div>
                                </div>
                            ))}

                            <div className="  px-4 flex items-center justify-between">
                                <div className="text-sm font-semibold">Sub-total:</div>
                                <div className="text-sm font-bold">{formatPrice(subtotal)}</div>
                            </div>

                            <div className="p-4 pb-8">
                                {/* Use Next router push for navigation to avoid full page reload */}
                                <CheckoutButton onClose={onClose} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
