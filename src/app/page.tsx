import HeroSection from "@/components/landing/Hero";
import CollectionBanner from "@/components/landing/CollectionBanner";
import ProductsBanner from "@/components/landing/ProductsBanner";

import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main style={{ fontFamily: "Arial, sans-serif" }}>
        <HeroSection />
        <CollectionBanner />
        <ProductsBanner />
      </main>
    </div>
  );
}
