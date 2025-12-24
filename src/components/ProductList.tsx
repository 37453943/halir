"use client";

import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import Breadcrumb from "./breadcrumb";
import logger from '@/lib/clientLogger';

interface ProductItem {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
    category: "men" | "women" | string;
    quantity?: number;
    collectionSlug?: string;
}

interface ProductListProps {
    title: string;
    categorySlug?: string;
    collectionSlug?: string;
    collectionImage?: string; // optional hero image for collections
}

const ProductList: React.FC<ProductListProps> = ({
    title,
    categorySlug,
    collectionSlug,
    collectionImage,
}) => {
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();

                if (categorySlug) {
                    params.append("category", categorySlug);
                }

                if (collectionSlug) {
                    params.append("collectionSlug", collectionSlug);
                }

                const queryString = params.toString();
                const url = `/api/products${queryString ? `?${queryString}` : ""}`;

                const response = await fetch(url);
                const data = await response.json();
                setProducts(data);
            } catch (error) {
                logger.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [categorySlug, collectionSlug]);

    // ✅ Hero image logic
    const bgImage = collectionImage || "/images/2.jpg";

    // ✅ Breadcrumb items
    const breadcrumbItems = [
        { label: "Home", href: "/" },
        collectionSlug
            ? { label: "Collections", href: "/collection" }
            : { label: "Products", href: "/products" },
        collectionSlug
            ? {
                label: title,
                href: `/collection/${collectionSlug}`,
                isCurrent: true,
            }
            : categorySlug
                ? {
                    label: title,
                    href: `/products/${categorySlug}`,
                    isCurrent: true,
                }
                : { label: title, href: "/products", isCurrent: true },
    ];

    return (
        <main className="min-h-screen bg-background">
            {/* Breadcrumb */}

            <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8 py-2">
                <Breadcrumb items={breadcrumbItems} />
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 ">
                    {breadcrumbItems[breadcrumbItems.length - 1]?.label}
                </h1>
            </div>

            {/* Hero Banner */}
            <div className="relative w-full h-[400px] sm:h-[450px] md:h-[500px] lg:h-[600px]">
                <img
                    src={bgImage}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://placehold.co/1200x600/444/fff?text=${title.toUpperCase()}`;
                    }}
                />
                <div className="absolute inset-0 bg-black opacity-30"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-widest text-white drop-shadow-lg text-center">
                        {title}
                    </h1>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">
                        Loading amazing products...
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        No products found for this collection/category.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:gap-8 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default ProductList;
