import Link from 'next/link';
import Breadcrumb from '@/components/breadcrumb';
import dbConnect from '@/lib/db';
import Collection from '@/models/Collections';

interface CollectionItem {
    _id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    images?: string[];
}
// Fetch collections directly from the database in the server component
async function getCollections(): Promise<CollectionItem[]> {
    try {
        await dbConnect();
        const cols = await Collection.find({}).sort({ name: 1 }).lean();
        // Ensure _id is string for client-side rendering
        return (cols || []).map((c: any) => ({ _id: String(c._id), name: c.name, slug: c.slug, imageUrl: (c && c.imageUrl) || undefined, images: (c && c.images) || [] })) as CollectionItem[];
    } catch (error) {
        // Server-side component: use structured logger
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { reqLogger } = await import('@/lib/logger');
        reqLogger().error({ err: error }, 'DB fetch error');
        return [];
    }
}

export default async function CollectionsIndexPage() {
    const collections = await getCollections();

    // Define breadcrumb items for the collections index page
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Collections', href: '/collection', isCurrent: true },
    ];

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header Section for Breadcrumb and Title */}
            <div className="bg-background border-b border-gray-200 py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumb items={breadcrumbItems} />
                    {/* The main page title for the collection index */}
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 mt-2">
                        ALL COLLECTIONS
                    </h1>
                </div>
            </div>

            {/* Collections List Section */}
            <div className="bg-background py-10">
                <div className="max-w-7xl mx-auto">
                    {collections.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 text-lg">
                            No collections are currently available.
                        </div>
                    ) : (
                        // Changed grid to 1 column to maximize width for banners
                        <div className="grid grid-cols-1 gap-20">
                            {collections.map((collection) => (
                                <Link
                                    key={collection._id}
                                    href={`/collection/${collection.slug}`} // Corrected to use /collections/
                                    className="block transition-all duration-300 hover:opacity-95"
                                >
                                    {/* Removed section wrapper to simplify width calculation */}
                                    <div className="relative h-[300px] md:h-[500px] flex items-center justify-center overflow-hidden">
                                        {/* Background Image */}
                                        <img
                                            src={collection.images && collection.images.length > 0 ? collection.images[0] : `https://placehold.co/1200x400/374151/ffffff?text=${encodeURIComponent(collection.name)}`}
                                            alt={`${collection.name} banner`}
                                            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black opacity-40 hover:opacity-50 transition-opacity duration-300"></div>

                                        {/* Collection Name */}
                                        <h2 className="relative z-10 text-white text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-widest uppercase text-center p-4 drop-shadow-lg">
                                            {collection.name}
                                        </h2>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}