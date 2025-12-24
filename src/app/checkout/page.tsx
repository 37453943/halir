"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logger from '@/lib/clientLogger';

interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
    image?: string;
    size?: string;
}

export default function CheckoutPage() {
    const router = useRouter();

    const [items, setItems] = useState<CartItem[]>(() => {
        try {
            const raw =
                typeof window !== "undefined"
                    ? sessionStorage.getItem("cart")
                    : null;
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const [email, setEmail] = useState("");
    const [newsletter, setNewsletter] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [address, setAddress] = useState("");
    const [user, setUser] = useState<any | null>(null);
    const [loadingUser, setLoadingUser] = useState(false);

    // If the user is authenticated via cookie, fetch current user and prefill contact fields
    React.useEffect(() => {
        (async () => {
            setLoadingUser(true);
            try {
                const r = await fetch('/api/auth/me', { credentials: 'include' });
                if (!r.ok) return;
                const data = await r.json();
                setUser(data.user);
                if (data.user?.email) setEmail(data.user.email);
                if (data.user?.name) {
                    const parts = (data.user.name as string).split(' ');
                    setFirstName(parts[0] || '');
                    setLastName(parts.slice(1).join(' ') || '');
                }
            } catch (e) {
                // ignore
            } finally {
                setLoadingUser(false);
            }
        })();
    }, []);
    const [city, setCity] = useState("");
    const [postal, setPostal] = useState("");
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState("");

    // Delivery and payment selections
    const [deliveryOption, setDeliveryOption] = useState<'standard' | ''>('standard');
    const [paymentMethod, setPaymentMethod] = useState<'cod' | ''>('cod');

    const [errors, setErrors] = useState<string[]>([]);

    const formatPrice = (v: number) => `RS ${v.toFixed(0)}`;

    // Local-only change of qty/remove: do not persist until order is placed
    const changeQty = (id: string, delta: number) => {
        setItems((prev) => prev.map((it) =>
            it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it
        ));
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const shipping = (deliveryOption === 'standard' && items.length) ? 200 : 0;
    const total = subtotal + shipping;

    const submitOrder = async () => {
        const e: string[] = [];

        if (!email) e.push("Email address is required.");
        if (!firstName) e.push("First name is required.");
        if (!lastName) e.push("Last name is required.");
        if (!address) e.push("Address is required.");
        if (!city) e.push("City is required.");
        if (!postal) e.push("Postal code is required.");
        if (!phone) e.push("Phone number is required.");
        if (!deliveryOption) e.push("Please select a delivery option.");
        if (!paymentMethod) e.push("Please select a payment method.");
        if (!items.length) e.push("Your cart is empty.");

        setErrors(e);
        if (e.length) return;

        try {
            const payload = {
                items: items.map(it => ({ productId: (it as any).id || (it as any).productId, name: it.name, price: it.price, qty: it.qty, size: it.size })),
                email,
                firstName,
                lastName,
                address,
                city,
                postal,
                phone,
                country,
                deliveryOption,
                paymentMethod,
                newsletter,
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                setErrors([data.error || 'Failed to create order']);
                return;
            }

            // Success
            sessionStorage.removeItem("cart");
            window.dispatchEvent(new CustomEvent("cart:update", { detail: 0 }));
            router.push(`/checkout/success?orderId=${data.orderId}`);
        } catch (err) {
            logger.error('Failed to complete order', err);
            setErrors([String(err)]);
        }
    };

    const orderDate = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 px-4">

                {/* LEFT — FORM */}
                <section className="bg-background border border-gray-200 py-10 px-2">

                    {/* CONTACT */}
                    <div className="border-b border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold uppercase">
                                Contact Information
                            </h2>
                            {!user && !loadingUser && (
                                <a href="/login" className="text-xs underline">
                                    Have an account? Log in
                                </a>
                            )}
                        </div>

                        <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                            <label className="text-sm w-32">Email Address</label>
                            <input required className="flex-1 border-none p-0 text-sm" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>

                        <div className="flex bg-white border border-gray-300 p-5 gap-5 items-start">
                            <div className="w-32" />
                            <div className="flex-1 flex items-start gap-3">
                                <input id="newsletter" type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-1" />
                                <div>
                                    <label htmlFor="newsletter" className="font-semibold text-sm block">Sign me up for the newsletter</label>
                                    <p className="text-xs text-gray-500 mt-1">We'll use this email to send you marketing and offers.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SHIPPING */}
                    <div className="p-6">
                        <h3 className="text-sm font-bold uppercase mb-4">
                            What is your shipping address?
                            <span className="text-xs text-gray-400 ml-2">*Required</span>
                        </h3>

                        <div>
                            <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                                <label className="text-sm w-32">First name</label>
                                <input required className="flex-1 border-none p-0 text-sm" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                            </div>

                            <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                                <label className="text-sm w-32">Last name</label>
                                <input required className="flex-1 border-none p-0 text-sm" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            </div>

                            <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                                <label className="text-sm w-32">Street</label>
                                <input required className="flex-1 border-none p-0 text-sm" placeholder="Street Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                            </div>

                            <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                                <label className="text-sm w-32">City</label>
                                <input required className="flex-1 border-none p-0 text-sm" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                            </div>

                            <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                                <label className="text-sm w-32">Postal</label>
                                <input required className="flex-1 border-none p-0 text-sm" placeholder="Postal Code" value={postal} onChange={(e) => setPostal(e.target.value)} />
                            </div>

                            <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                                <label className="text-sm w-32">Phone</label>
                                <input required className="flex-1 border-none p-0 text-sm" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </div>

                            <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                                <label className="text-sm w-32">Country</label>
                                <input required className="flex-1 border-none p-0 text-sm" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
                            </div>

                            {/* Delivery option */}
                            <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                                <label className="text-sm w-32">Delivery</label>
                                <div className="flex-1">
                                    <label className="flex items-center gap-3">
                                        <input type="radio" name="delivery" checked={deliveryOption === 'standard'} onChange={() => setDeliveryOption('standard')} />
                                        <div>
                                            <div className="font-semibold">Standard delivery</div>
                                            <div className="text-sm text-gray-500">2-4 business days · RS 200</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                                <label className="text-sm w-32">Payment</label>
                                <div className="flex-1">
                                    <label className="flex items-center gap-3">
                                        <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                                        <div>
                                            <div className="font-semibold">Cash on delivery (COD)</div>
                                            <div className="text-sm text-gray-500">Pay when you receive the order</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                        </div>

                        {/* FORM ERRORS */}
                        {errors.length > 0 && (
                            <ul className="mt-4 text-xs text-red-600 space-y-1">
                                {errors.map((err, i) => (
                                    <li key={i}>• {err}</li>
                                ))}
                            </ul>
                        )}

                        <button
                            onClick={submitOrder}
                            className="w-full bg-black text-white py-4 text-sm font-bold mt-6 uppercase"
                        >
                            Place order
                        </button>
                    </div>


                </section>

                {/* RIGHT — ORDER SUMMARY */}
                <aside className="bg-background border border-gray-200 h-fit py-10 px-3">
                    <div className="flex justify-between items-center mb-4 py-4">
                        <h3 className="text-sm font-bold uppercase">
                            Your Items ({items.length})
                        </h3>

                    </div>

                    {items.map((it) => (
                        <div key={it.id} className="flex gap-4 mb-4 border border-gray-200 p-3">
                            <Image
                                src={it.image || "/images/placeholder.png"}
                                alt={it.name}
                                width={70}
                                height={70}
                                className="w-30 h-30 object-cover"
                            />
                            <div className="flex-1 text-xs">
                                <div className="font-semibold uppercase">{it.name}</div>
                                <div className="text-gray-600">eau de parfum</div>
                                <div className="mt-4 space-y-2">
                                    <p>Price: {formatPrice(it.price)}</p>
                                    <p>Size: {it.size}</p>
                                    <p>Quantity: {it.qty}</p></div>
                            </div>

                        </div>
                    ))}
                    <h3 className="text-sm font-bold uppercase mt-12">
                        Order Summary
                    </h3>

                    <div className="border-t border-gray-200 pt-4 mt-4 text-sm">
                        <div className="mb-2 text-xs text-gray-600">
                            Order Date: <span className="text-gray-800">{orderDate}</span>
                        </div>

                        <div className="flex justify-between mb-1">
                            <span>Sub-total</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>

                        <div className="flex justify-between mb-3">
                            <span>Shipping</span>
                            <span>{formatPrice(shipping)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>

                        <div className="text-xs text-gray-500 mt-4">
                            Need help?{" "}
                            <a className="underline" href="mailto:help@example.com">
                                help@example.com
                            </a>{" "}
                            / 1-800-000-000
                        </div>
                    </div>
                </aside>

            </div>
        </main>
    );
}
