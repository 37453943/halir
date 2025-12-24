import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product, { IProduct } from '@/models/Product';
import fs from 'fs';
import path from 'path';
import { generateRequestId } from '@/lib/requestId';
import { reqLogger } from '@/lib/logger';
import { jsonResponse } from '@/lib/response';
import { saveBase64Image, deleteImageByPath } from '@/lib/storage';

interface Params {
    params: { id: string };
}

// 1. GET (Read Single Product - standard REST practice)
export async function GET(request: Request, { params }: Params) {
    const reqId = request.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);
    await dbConnect();
    const { id } = await params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return jsonResponse({ message: "Product not found" }, 404, reqId);
        }
        return jsonResponse(product, 200, reqId);
    } catch (error: any) {
        log.error({ err: error }, 'GET /api/products/:id error');
        return jsonResponse({ message: "Failed to fetch product" }, 500, reqId);
    }
}

// PATCH: Update Product by ID (No changes needed)
export async function PATCH(request: Request, { params }: Params) {
    await dbConnect();
    const { id } = await params;
    try {
        const body = await request.json();

        // Helper to save base64 images via storage
        const saveBase64Images = async (base64Arr?: string[]) => {
            if (!base64Arr || !Array.isArray(base64Arr) || base64Arr.length === 0) return [];
            const saved: string[] = [];
            const log = reqLogger();
            for (const data of base64Arr) {
                try {
                    const url = await saveBase64Image(data, { folder: 'products' } as any);
                    saved.push(url);
                } catch (e) {
                    log.error({ err: e }, 'Failed to save image via storage');
                }
            }
            return saved;
        };

        // If client requested image removals, process them first (safe deletion from public/images)
        if (body.imagesToRemove && Array.isArray(body.imagesToRemove) && body.imagesToRemove.length > 0) {
            try {
                const product = await Product.findById(id);
                if (product) {
                    const toRemove: string[] = body.imagesToRemove.filter((i: any) => typeof i === 'string');

                    // Filter out removed images from product.images
                    product.images = (product.images || []).filter(img => !toRemove.includes(img));

                    // Delete images via storage abstraction (S3 or local)
                    for (const imgPath of toRemove) {
                        try {
                            await deleteImageByPath(imgPath);
                        } catch (e) {
                            const log = reqLogger();
                            log.error({ err: e, imgPath }, 'Failed to delete image file');
                        }
                    }

                    await product.save();
                }
            } catch (e) {
                const log = reqLogger();
                log.error({ err: e }, 'Error removing images');
            }
            delete body.imagesToRemove; // don't pass this to the update
        }

        // If imagesBase64 provided, merge with existing images
        if (body.imagesBase64) {
            const product = await Product.findById(id);
            const existingImages: string[] = (product && product.images) || [];
            const newPaths = await saveBase64Images(body.imagesBase64);
            body.images = existingImages.concat(newPaths);
            delete body.imagesBase64;
        }

        // If a new featureImageBase64 is provided, save it and set/replace featureImage
        if (body.featureImageBase64) {
            try {
                const saved = await saveBase64Images([body.featureImageBase64]);
                if (saved.length > 0) {
                    body.featureImage = saved[0];
                }
            } catch (e) {
                const log = reqLogger();
                log.error({ err: e }, 'Failed to save feature image');
            }
            delete body.featureImageBase64;
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true
        });

        if (!updatedProduct) {
            return jsonResponse({ message: "Product not found" }, 404, reqId);
        }
        return jsonResponse(updatedProduct, 200, reqId);
    } catch (error: any) {
        const log = reqLogger();
        log.error({ err: error }, 'PATCH error');
        return jsonResponse({ message: error.message || "Failed to update product" }, 400, reqId);
    }
}

// DELETE: Delete Product by ID (No changes needed)
export async function DELETE(request: Request, { params }: Params) {
    const reqId = request.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);
    await dbConnect();
    const { id } = await params;
    log.info({ id }, 'Attempting to delete product');
    try {
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return jsonResponse({ message: "Product not found" }, 404, reqId);
        }

        // Attempt to delete associated images
        try {
            if (deletedProduct.images && Array.isArray(deletedProduct.images)) {
                for (const img of deletedProduct.images) {
                    await deleteImageByPath(img);
                }
            }
            if (deletedProduct.featureImage) await deleteImageByPath(deletedProduct.featureImage);
        } catch (e) {
            log.warn({ err: e }, 'Failed to fully remove associated images');
        }

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        log.error({ err: error }, 'DELETE error');
        return jsonResponse({ message: "Failed to delete product" }, 500, reqId);
    }
}