'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Search, Mail, User, ShoppingBag } from "lucide-react";
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
// Lazy load cart drawer to avoid server import issues
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });
import logger from '@/lib/clientLogger';
// Removed 'next/link' import as it causes compilation errors in this environment
// import Link from "next/link"; 

export default function Header() {
    // Make header sticky so it stays visible on scroll
    // Cart state
    const [cartCount, setCartCount] = useState<number>(() => {
        try {
            const raw = sessionStorage.getItem('cart');
            if (raw) {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed.length : 0;
            }
            return 0;
        } catch {
            return 0;
        }
    });
    const [cartOpen, setCartOpen] = useState<boolean>(false);
    const [user, setUser] = useState<any | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        // Try to load current user from API using cookie-based auth
        (async () => {
            try {
                const r = await fetch('/api/auth/me', { credentials: 'include' });
                if (!r.ok) return;
                const data = await r.json();
                setUser(data.user);
            } catch (e) {
                // ignore
            }
        })();
    }, []);


    useEffect(() => {
        const onUpdate = (e: any) => {
            // Accept CustomEvent with detail, otherwise fallback to reading sessionStorage for the current cart length.
            const detail = e && (e.detail);
            if (typeof detail === 'number') {
                logger.debug('Header received cart:update', detail);
                setCartCount(detail);
                return;
            }
            // Fallback: read sessionStorage
            try {
                const raw = sessionStorage.getItem('cart');
                const parsed = raw ? JSON.parse(raw) : [];
                const len = Array.isArray(parsed) ? parsed.length : 0;
                logger.debug('Header received cart:update (fallback), parsed length', len);
                setCartCount(len);
            } catch (err) {
                logger.debug('Header received cart:update fallback parse error', err);
                setCartCount(0);
            }
        };
        window.addEventListener('cart:update', onUpdate as EventListener);

        // Listen for storage changes so multiple tabs stay in sync
        const onStorage = (ev: StorageEvent) => {
            if (ev.key === 'cart') {
                try {
                    const parsed = JSON.parse(ev.newValue || '[]');
                    logger.debug('Header storage event for cart, parsed length', Array.isArray(parsed) ? parsed.length : 0);
                    setCartCount(Array.isArray(parsed) ? parsed.length : 0);
                } catch (e) {
                    logger.debug('Header storage event parse error', e);
                    setCartCount(0);
                }
            }
        };
        window.addEventListener('storage', onStorage);

        // Allow other components to open the cart via event (e.g., Add to Cart button)
        const onOpen = () => {
            logger.debug('Header received cart:open');
            // Don't open the cart drawer while on checkout pages
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/checkout')) {
                logger.debug('Header: ignoring cart:open on checkout page');
                return;
            }
            setCartOpen(true);
        };
        window.addEventListener('cart:open', onOpen as EventListener);

        return () => {
            window.removeEventListener('cart:update', onUpdate as EventListener);
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('cart:open', onOpen as EventListener);
        };
    }, []);



    return (
        <header className="w-full sticky top-0 z-50 bg-white relative">
            {/* Top Banner - Font set to sans (Roboto/Inter) */}
            <div className="font-sans bg-black text-white text-center py-3 px-4 text-sm">
                Enjoy complimentary gift packaging on orders with 100ml eau de parfum
            </div>

            {/* Main Header Container */}
            <div className="bg-white border-b border-gray-50">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-stretch py-0">

                    {/*
                    ======================================================
                    MOBILE LAYOUT (Visible below large screen: lg:hidden)
                    ======================================================
                    */}
                    <div className="flex w-full items-center justify-between lg:hidden h-[60px]">

                        {/* Left Icons: Menu and Search */}
                        <div className="flex items-center space-x-4">
                            <button aria-label="Open menu" className="text-black p-1">
                                <Menu className="w-6 h-6" />
                            </button>
                            <button aria-label="Search" className="text-black p-1">
                                <Search className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Center: Logo (Mobile) */}
                        <a href="/" className="flex flex-col justify-center items-center no-underline flex-shrink-0">
                            <img
                                src="/images/logo.png"
                                alt="Halir Perfumery Logo"
                                className="h-5 w-auto" // Adjust height as needed
                            />
                        </a>

                        {/* Right Icon: Cart (Mobile) */}
                        {!(pathname || '').startsWith('/checkout') && (
                            <div className="relative">
                                <button onClick={(e) => { e.preventDefault(); setCartOpen(true); }} className="text-black hover:text-gray-600 transition flex items-center p-1">
                                    <ShoppingBag className="w-6 h-6" />
                                    <span className="ml-1 text-sm">({cartCount})</span>
                                </button>

                                <input
                                    type="text"
                                    placeholder="Search for products, scents, samples"
                                    className="w-full pl-10 pr-4 py-2 text-sm text-gray-600 placeholder-gray-400 border-none outline-none focus:outline-none focus:ring-0 font-sans"
                                />
                            </div>
                        )}

                        {/* User/Mail Icons Group */}
                        <div className="flex items-center justify-end h-full">
                            <div className="border-l border-gray-200 px-4 py-2">
                                <button className="text-black hover:text-gray-600 transition">
                                    <Mail className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="border-l border-gray-200 px-4 py-2">
                                {user ? (
                                    <a href="/account" className="text-black hover:text-gray-600 transition text-sm">{user.name || 'Account'}</a>
                                ) : (
                                    <a href="/login" className="text-black hover:text-gray-600 transition">
                                        <User className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex w-full items-stretch py-0">

                        {/* 1. Left Section: Logo (Fixed Width) */}
                        <a href="/" className="flex flex-col justify-center items-start py-4 pr-6 no-underline flex-shrink-0">
                            <img
                                src="/images/logo.png"
                                alt="Halir Perfumery Logo"
                                className="h-9 w-auto" // Adjust height as needed
                            />
                        </a>

                        {/* 2. Middle Section: Search & Navigation (Stretches) */}
                        <div className="flex flex-col flex-grow border-x border-gray-200">

                            {/* Top Row: Search Bar and User Icons */}
                            <div className="flex items-center border-b border-gray-200 py-2 h-1/2">
                                {/* Search Input Container */}
                                <div className="relative flex items-center flex-grow mx-8">
                                    <Search className="w-5 h-5 text-gray-400 absolute left-3" />
                                    <input
                                        type="text"
                                        placeholder="Search for products, scents, samples"
                                        className="w-full pl-10 pr-4 py-2 text-sm text-gray-600 placeholder-gray-400 border-none outline-none focus:outline-none focus:ring-0 font-sans"
                                    />
                                </div>

                                {/* User/Mail Icons Group */}
                                <div className="flex items-center justify-end h-full">
                                    <div className="border-l border-gray-200 px-4 py-2">
                                        <button className="text-black hover:text-gray-600 transition">
                                            <Mail className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="border-l border-gray-200 px-4 py-2">
                                        {user ? (
                                            <div className="flex items-center gap-3">
                                                {/* Show username directly and link to account */}
                                                <a href="/account" className="text-black hover:text-gray-600 transition text-sm">{user.name || 'Account'}</a>
                                            </div>
                                        ) : (
                                            <a href="/login" className="text-black hover:text-gray-600 transition">
                                                <User className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row: Navigation Links */}
                            <nav className="flex items-center justify-center py-2 h-1/2 overflow-x-auto whitespace-nowrap">
                                <div className="flex justify-center items-center gap-6">
                                    {([
                                        { label: "COLLECTIONS", href: "/collection" },
                                        { label: "MEN", href: "/products/men" },
                                        { label: "WOMEN", href: "/products/women" },
                                        { label: "ABOUT US", href: "/about" },
                                        { label: "CONTACT US", href: "/contact" },
                                        // Admin nav — render only for admins
                                        { label: "ADMIN", href: "/admin", adminOnly: true },
                                    ] as Array<any>).map((item) => {
                                        if (item.adminOnly && (!user || user.role !== 'admin')) return null;
                                        return (
                                            <a
                                                key={item.href}
                                                href={item.href}
                                                className="text-xs font-heading font-bold text-black tracking-widest uppercase hover:text-gray-600 transition-all no-underline"
                                            >
                                                {item.label}
                                            </a>
                                        );
                                    })}
                                </div>
                            </nav>
                        </div>

                        {/* 3. Right Section: Cart (Fixed Width) */}
                        {!(pathname || '').startsWith('/checkout') && (
                            <div className="relative flex items-center justify-center py-4 pl-6 flex-shrink-0">
                                <button onClick={(e) => { e.preventDefault(); setCartOpen(true); }} className="relative text-black hover:text-gray-600 transition flex items-center">
                                    <ShoppingBag className="w-5 h-5" />
                                    <span className="ml-2 text-sm font-bold">({cartCount})</span>
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {/* Single CartDrawer instance to avoid duplicate listeners/instances */}
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </header>
    );
}