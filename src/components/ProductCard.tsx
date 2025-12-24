"use client";

import React from "react";
import Link from "next/link";
import logger from '@/lib/clientLogger';

interface ProductItem {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
    featureImage?: string; // ✅ prefer this image when present
    images?: string[];
    category: "men" | "women" | string;
    volume?: string;
    type?: string;
    quantity?: number;
}

interface ProductCardProps {
    product: ProductItem;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {

    // size is stored in `type` in admin; show price in Pakistani Rupees
    const sizeLabel = product.type || product.volume || '50 ml';
    const formatPrice = (v: number) => `RS ${v.toFixed(0)}`;
    // Determine availability: if quantity is set, require it to be > 0 to show Add to cart
    const inStock = typeof product.quantity === 'number' ? product.quantity > 0 : true;


    return (
        <div className="group bg-background border-x border-gray-200 w-full max-w-sm mx-auto">
            {/* PRODUCT IMAGE */}
            <div className="relative bg-background flex items-center justify-center  p-0 overflow-hidden">
                <Link href={`/product/${product._id}`} className="block w-full h-full flex items-center justify-center">
                    <img
                        src={product.featureImage ? product.featureImage : (product.images && product.images.length > 0 ? product.images[0] : product.imageUrl)}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain cursor-pointer"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://placehold.co/400x500/000000/ffffff?text=${product.name.replace(/\s/g, "+")}`;
                        }}
                    />
                </Link>
            </div>

            {/* LABEL SECTION */}
            <div className=" text-black border border-gray-200 border-b-0">
                <div className="mb-1 mt-3 px-2">
                    <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight mb-2">
                        <Link href={`/product/${product._id}`} className="hover:underline">{product.name}</Link>
                    </h3>
                </div>

                <div className=" text-black border border-gray-200 p-2">

                    <p className="text-sm font-light text-gray-700 mb-1">{sizeLabel}</p>
                    <p className="text-sm font-light text-gray-700 mb-3">eau de parfum</p>
                </div>

                <div className=" text-black p-2">
                    <div className="flex items-center justify-between">
                        {inStock ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    try {
                                        logger.debug('Add to cart clicked', { id: product._id, name: product.name });
                                        const raw = sessionStorage.getItem('cart');
                                        interface CartStorageItem { id: string; name: string; price: number; qty: number; image?: string; size?: string }
                                        const parsed = raw ? (JSON.parse(raw) as CartStorageItem[]) : ([] as CartStorageItem[]);
                                        const image = product.featureImage ? product.featureImage : (product.images && product.images.length > 0 ? product.images[0] : product.imageUrl);
                                        const id = product._id;
                                        const existing = parsed.find(i => i.id === id);
                                        const currentQty = existing ? existing.qty : 0;
                                        if (typeof product.quantity === 'number' && currentQty >= product.quantity) {
                                            logger.debug('Cannot add to cart, not enough stock', { id, currentQty, stock: product.quantity });
                                            return;
                                        }
                                        if (existing) {
                                            existing.qty = Math.min(99, existing.qty + 1);
                                        } else {
                                            parsed.push({ id, name: product.name, price: product.price, qty: 1, image, size: sizeLabel });
                                        }
                                        sessionStorage.setItem('cart', JSON.stringify(parsed));
                                        logger.debug('Cart after add', parsed);
                                        window.dispatchEvent(new CustomEvent('cart:update', { detail: parsed.length }));
                                        window.dispatchEvent(new Event('cart:open'));
                                        // Smoothly scroll to top so user sees header/cart open state
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    } catch (err) {
                                        logger.error('Failed to add to cart', err);
                                    }
                                }}
                                className="text-m text-gray-900 hover:underline "
                                aria-label={`Add ${product.name} to cart`}
                            >
                                Add to cart
                            </button>
                        ) : (
                            <div className="text-red-600 font-semibold">Out of stock</div>
                        )}

                        <div className="text-m text-gray-900">{formatPrice(product.price)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
