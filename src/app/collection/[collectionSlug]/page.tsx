// app/collections/[collectionSlug]/page.tsx
import ProductList from '@/components/ProductList';
import dbConnect from '@/lib/db';
import Collection from '@/models/Collections';

const formatCollectionTitle = (slug: string) =>
    slug
        .split(/[-_]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

export default async function CollectionDetailPage({
    params,
}: {
    params: Promise<{ collectionSlug: string }>;
}) {
    const { collectionSlug } = await params;

    await dbConnect();

    // ✅ Fetch the collection from DB
    const collection = await Collection.findOne({ slug: collectionSlug }).lean();

    const title = `${formatCollectionTitle(collectionSlug)}`;

    return (
        <ProductList
            title={title}
            collectionSlug={collectionSlug}
            collectionImage={collection?.images && collection.images.length > 0 ? collection.images[0] : undefined}
        />
    );
}
