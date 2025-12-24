// app/products/[category]/page.tsx
import ProductList from "@/components/ProductList";

interface CategoryPageProps {
    params: Promise<{ category: string }>; // ✅ params is a Promise in App Router
}

const formatCategoryTitle = (slug: string) =>
    slug
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

export default async function CategoryPage({ params }: CategoryPageProps) {
    // ✅ Await the params to unwrap the promise
    const { category } = await params;

    const title = `${formatCategoryTitle(category)}`;

    return (
        <main className="min-h-screen bg-gray-50">
            <ProductList title={title} categorySlug={category} />
        </main>
    );
}
