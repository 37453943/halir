"use client";
import React from 'react';

// This component acts as a clickable banner that directs the user to the main collections index page.
const CollectionBanner: React.FC = () => {
    return (
        // The entire section is wrapped in an anchor tag <a> to make it clickable.
        // We assume the route to the main collections page is '/collection'.
        <a
            href="/collection"
            className="block transition-all duration-300 hover:opacity-96"
        >
            <section className="bg-background py-16 px-4 sm:px-6 lg:px-8">
                {/* Max-width container to center the content and provide side margins */}
                <div className="max-w-7xl mx-auto relative h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden rounded-lg">
                    {/* Background Image */}
                    <img
                        src="/images/2.jpg" // Use your image path
                        alt="A stylized background image for the collections page"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        // Add a simple error fallback handler since this is a client component
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://placehold.co/1200x500/111/fff?text=COLLECTIONS+BANNER";
                        }}
                    />

                    {/* Optional: Overlay for text readability (adjust opacity as needed) */}
                    <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-50 transition-opacity duration-300"></div>

                    {/* Central Text */}
                    <h2 className="relative z-10 text-white text-3xl md:text-5xl font-bold tracking-widest uppercase text-center p-4">
                        ALL COLLECTIONS
                    </h2>
                </div>
            </section>
        </a>
    );
};

export default CollectionBanner;