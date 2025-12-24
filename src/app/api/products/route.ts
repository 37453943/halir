// app/api/products/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product, { IProduct } from '@/models/Product';
import fs from 'fs';
import path from 'path';
import Collection from '@/models/Collections'; // <-- Import Collection model
import { createProductSchema } from '@/lib/validators/products';
import { generateRequestId } from '@/lib/requestId';
import { reqLogger } from '@/lib/logger';
import { jsonResponse } from '@/lib/response';
import { saveBase64Image } from '@/lib/storage';

// GET: Read All Products, with optional filtering by name, slug, or category
export async function GET(request: Request) {
    const reqId = request.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);
    await dbConnect();
    try {
        const { searchParams } = new URL(request.url);

        // Read all possible filter parameters
        const id = searchParams.get('id');
        const category = searchParams.get('category');
        const collectionSlug = searchParams.get('collectionSlug');
        // NEW: Accept collection name filter
        const collectionName = searchParams.get('collectionName'); // <-- NEW PARAM

        let filter: any = {};
        let finalCollectionSlug = collectionSlug;

        // Step 1: Resolve collectionName to collectionSlug
        if (collectionName) {
            const collection = await Collection.findOne({ name: collectionName });
            if (collection) {
                finalCollectionSlug = collection.slug; // Use the found slug
            } else {
                // If the name is provided but not found, return an empty array early
                return jsonResponse([], 200, reqId);
            }
        }

        // Step 2: Build the filter object
        if (id) {
            filter._id = id;
        }

        if (category) {
            filter.category = new RegExp(`^${category}$`, "i"); // case-insensitive match
        }


        // Use the resolved slug (either from collectionSlug URL param or collectionName lookup)
        if (finalCollectionSlug) {
            filter.collectionSlug = finalCollectionSlug;
        }

        // ... (rest of the sorting logic remains the same) ...

        type SortOption = { [key: string]: 1 | -1; };
        const sortCriteria: SortOption = id ? {} : { createdAt: -1 as 1 | -1 };

        const products: IProduct[] = await Product.find(filter).sort(sortCriteria);

        return jsonResponse(products, 200, reqId);

    } catch (error: any) {
        const log = reqLogger();
        log.error({ err: error }, 'GET products error');
        return jsonResponse({ message: "Failed to fetch products" }, 500, reqId);
    }
}

// POST: Create a new Product
export async function POST(request: Request) {
    const reqId = request.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);
    await dbConnect();
    try {
        const body = await request.json();
        // Validate request body
        const parsed = createProductSchema.safeParse(body);
        if (!parsed.success) {
            return jsonResponse({ error: 'Invalid product payload', details: parsed.error.format() }, 400, reqId);
        }
        const data = parsed.data;

        // Helper: save base64 images using storage abstraction and return array of public paths
        const saveBase64Images = async (base64Arr?: string[]) => {
            if (!base64Arr || !Array.isArray(base64Arr) || base64Arr.length === 0) return [];
            const saved: string[] = [];
            for (const data of base64Arr) {
                try {
                    const url = await saveBase64Image(data, { folder: 'products' } as any);
                    saved.push(url);
                } catch (e) {
                    const log = reqLogger();
                    log.error({ err: e }, 'Failed to save image via storage');
                }
            }
            return saved;
        };

        // If client provided imagesBase64 array, save them and set images
        if (data.imagesBase64) {
            const newPaths = await saveBase64Images(data.imagesBase64);
            data.images = newPaths;
            delete data.imagesBase64;
        }

        // If client provided a single featureImageBase64, save it and set featureImage
        if (data.featureImageBase64) {
            try {
                const saved = await saveBase64Images([data.featureImageBase64]);
                if (saved.length > 0) {
                    data.featureImage = saved[0];
                }
            } catch (e) {
                const log = reqLogger();
                log.error({ err: e }, 'Failed to save feature image via storage');
            }
            delete data.featureImageBase64;
        }

        const newProduct = new Product(data);
        const savedProduct: IProduct = await newProduct.save();
        log.info({ productId: savedProduct._id }, 'Product created');
        return jsonResponse(savedProduct, 201, reqId);
    } catch (error: any) {
        log.error({ err: error }, 'POST error');
        // Handle Mongoose validation or duplicate key errors
        return jsonResponse({ message: error.message || "Failed to create product" }, 400, reqId);
    }
}