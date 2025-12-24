"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Breadcrumb from "@/components/breadcrumb";
import Image from "next/image";
import logger from '@/lib/clientLogger';

interface ProductItem {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
    featureImage?: string;
    category: string;
    volume?: string;
    type?: string;
    description?: string;
    images?: string[];
    quantity?: number;
}

export default function ProductPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<ProductItem | null>(null);
    // Selected image for the gallery (feature image defaults later when product loads)
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedQty, setSelectedQty] = useState<number>(1);

    const formatPrice = (v: number) => `RS ${v.toFixed(0)}`;

    const addToCart = (qty = 1) => {
        try {
            const raw = sessionStorage.getItem('cart');
            const parsed = raw ? JSON.parse(raw) as Array<{ id: string, name: string, price: number, qty: number, image?: string, size?: string }> : [];
            const image = product?.featureImage ? product.featureImage : (product?.images && product?.images.length > 0 ? product.images[0] : product?.imageUrl);
            const id = product?._id;
            if (!id || !product) return;
            const existing = parsed.find(i => i.id === id);
            const currentQty = existing ? existing.qty : 0;
            if (typeof product.quantity === 'number' && currentQty + qty > product.quantity) {
                // Not enough stock
                logger.debug('addToCart: not enough stock', { id, currentQty, stock: product.quantity });
                return;
            }
            if (existing) {
                existing.qty = Math.min(99, existing.qty + qty);
            } else {
                parsed.push({ id, name: product.name, price: product.price, qty, image, size: product.volume || product.type || '50 ml' });
            }
            sessionStorage.setItem('cart', JSON.stringify(parsed));
            window.dispatchEvent(new CustomEvent('cart:update', { detail: parsed.length }));
            // Open cart drawer to show the added item
            window.dispatchEvent(new Event('cart:open'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            logger.error('Failed to add to cart (checkout button)', err);
        }
    };

    useEffect(() => {
        // Fetch product by ID (replace with your real API)
        fetch(`/api/products/${id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data);
                const defaultImg = data.featureImage ? data.featureImage : (data.images && data.images.length > 0 ? data.images[0] : data.imageUrl);
                setSelectedImage(defaultImg || null);
            })
            .catch(err => logger.error(err));
    }, [id]);


    if (!product) return <p className="p-10 text-gray-600">Loading product...</p>;

    // Breadcrumb items using product data
    const breadcrumbItems = [
        { label: "Home", href: "/" },
        product.category
            ? { label: "Products", href: "/products" }
            : { label: "Products", href: "/products" },
        {
            label: product.name,
            href: `/product/${id}`,
            isCurrent: true,
        },
    ];

    return (
        <main className=" bg-background ">
            <div className="max-w-6xl mx-auto px-4 sm:px-4 lg:px-3 py-2 border-x-2 border-gray-200 ">
                <Breadcrumb items={breadcrumbItems} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] 
                p-3 max-w-6xl mx-auto 
                border-l-2 border-r-2 border-gray-200">

                {/* LEFT — PRODUCT IMAGES (Feature image first, selectable gallery) */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    {/* Thumbnails (vertical on large screens) */}
                    <div className="hidden lg:flex flex-col gap-4 mr-4">
                        {(() => {
                            const others = (product.images || []).filter(
                                img => img !== product.featureImage
                            );
                            const all = [
                                ...(product.featureImage ? [product.featureImage] : []),
                                ...others,
                            ];

                            return all.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(img)}
                                    className="w-20 h-20 p-1 overflow-hidden transition-opacity duration-200 opacity-50 hover:opacity-100"

                                    style={{ opacity: selectedImage === img ? 1 : undefined }}
                                >
                                    <Image
                                        src={img}
                                        alt={`thumb-${idx}`}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ));
                        })()}
                    </div>


                    {/* Main image */}
                    <div className="w-full flex items-center justify-center">
                        <Image
                            src={selectedImage || (product.featureImage ? product.featureImage : (product.images && product.images.length > 0 ? product.images[0] : product.imageUrl)) || ''}
                            alt={product.name}
                            width={600}
                            height={560}
                            className="w-full object-contain max-h-[460px]"
                        />
                    </div>

                    {/* Mobile thumbnails (below main image) */}
                    <div className="grid grid-cols-4 gap-4 mt-3 lg:hidden">
                        {(() => {
                            const others = (product.images || []).filter(img => img !== product.featureImage);
                            const all = [...(product.featureImage ? [product.featureImage] : []), ...others];
                            return all.map((img, idx) => (
                                <button key={idx} onClick={() => setSelectedImage(img)} className={`border p-1 ${selectedImage === img ? 'ring-2 ring-black' : 'hover:opacity-80'}`}>
                                    <Image src={img} alt={`thumb-${idx}`} width={160} height={80} className="w-full h-20 object-cover" />
                                </button>
                            ));
                        })()}
                    </div>
                </div>

                {/* RIGHT — PRODUCT DETAILS */}
                <div>

                    {/* Title + Price */}
                    <div className="flex justify-between items-start px-4 pb-6">
                        <div>
                            <h1
                                className="text-3xl font-semibold uppercase tracking-wide"
                                style={{ fontFamily: "Arial" }}
                            >
                                {product.name}
                            </h1>
                            <p
                                className="text-sm mt-1 text-gray-600 lowercase"
                                style={{ fontFamily: "Open Sans" }}
                            >
                                eau de parfum
                            </p>
                        </div>

                        <div className="text-right mt-2">
                            <p className="text-lg font-medium text-gray-800">
                                {formatPrice(product.price)}
                            </p>

                        </div>
                    </div>

                    {/* Size */}
                    <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center">
                        <label className="text-xs text-gray-900">
                            Size:
                        </label>
                        <select className="w-full border-none p-0 text-sm focus:outline-none">
                            <option>{product.volume || "50 ml"}</option>
                            <option>Tester</option>
                        </select>
                    </div>

                    {/* Quantity */}
                    <div className="flex bg-white border border-gray-300 p-5 gap-5 items-center mb-6">
                        <label className="text-xs text-gray-900">
                            Quantity:
                        </label>
                        <select value={selectedQty} onChange={(e) => setSelectedQty(Number(e.target.value))} className="w-full border-none p-0 text-sm w-16 focus:outline-none">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(q => (
                                <option key={q} value={q}>{q}</option>
                            ))}
                        </select>
                    </div>


                    {/* CTA */}
                    <div className="mx-3">
                        <button onClick={(e) => { e.preventDefault(); addToCart(selectedQty); }} className="w-full py-4 bg-black text-white font-bold text-l uppercase tracking-widest hover:bg-gray-800 transition mb-8">
                            Add to cart
                        </button>
                        {/* Description */}
                        <div
                            className="text-sm text-gray-700 leading-relaxed pb-4"
                            style={{ fontFamily: "Open Sans" }}
                        >
                            <p className="whitespace-pre-line">
                                {product.description ||
                                    "Picture a place so vast, so remote you can journey weeks without encountering another soul..."}
                            </p>


                        </div>
                    </div>




                    {/* Footer Links */}
                    <div className="text-xs text-gray-600 flex justify-between p-4 border-t-2 border-gray-200">
                        <span>Need Help?</span>

                    </div>

                </div>

            </div>
        </main>
    );
}
