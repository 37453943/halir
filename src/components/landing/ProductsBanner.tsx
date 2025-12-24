"use client";

import React from "react";

interface ProductCategoryCardProps {
    title: string;
    slug: string;
    imageUrl: string;
    imageAlt: string;
}

const ProductCategoryCard: React.FC<ProductCategoryCardProps> = ({
    title,
    slug,
    imageUrl,
    imageAlt,
}) => {
    return (
        <div className="flex-1 min-w-[300px]">
            <a
                href={`/products/${slug}`}
                className="group block relative overflow-hidden rounded-lg shadow-xl h-[350px] sm:h-[450px]"
            >
                {/* Background Image */}
                <img
                    src={imageUrl}
                    alt={imageAlt}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://placehold.co/600x450/444/fff?text=${title.toUpperCase()}`;
                    }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black opacity-30 transition-opacity duration-500 group-hover:opacity-10"></div>

                {/* Text & Button */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                    <span className="text-xl font-thin tracking-widest mb-2">CATEGORY</span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-widest">
                        {title}
                    </h2>
                    <div className="mt-6 transition-opacity duration-300 opacity-80 group-hover:opacity-100">
                        <span className="inline-block px-6 py-2 bg-white text-black text-sm uppercase font-semibold tracking-wider border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300">
                            View Products
                        </span>
                    </div>
                </div>
            </a>
        </div>
    );
};

const ProductsBanner: React.FC = () => {
    return (
        <>
            {/* Hero Banner */}
            <section className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px]">
                <img
                    src="/images/3.jpg" // ✅ replace with your own local image
                    alt="Shop By Category"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                            "https://placehold.co/1200x600/444/fff?text=SHOP+BY+CATEGORY";
                    }}
                />
                <div className="absolute inset-0 bg-black opacity-40"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
                    <h1 className="text-xs sm:text-sm tracking-widest uppercase mb-2">
                        DESIGNED TO LAST. CRAFTED TO IMPRESS
                    </h1>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase">
                        Shop By Category
                    </h2>
                </div>
            </section>

            {/* Category Cards Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8">
                    <ProductCategoryCard
                        title="Men's"
                        slug="men"
                        imageUrl="/images/5.jpg"
                        imageAlt="Man wearing a fashionable coat"
                    />
                    <ProductCategoryCard
                        title="Women's"
                        slug="women"
                        imageUrl="/images/4.jpg"
                        imageAlt="Flowers and soft fabrics"
                    />
                </div>
            </section>
        </>
    );
};

export default ProductsBanner;
