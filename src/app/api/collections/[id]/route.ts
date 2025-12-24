import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Collection from '@/models/Collections';
import fs from 'fs';
import path from 'path';
import { generateRequestId } from '@/lib/requestId';
import { reqLogger } from '@/lib/logger';
import { jsonResponse } from '@/lib/response';
import { saveBase64Image, deleteImageByPath } from '@/lib/storage';

// Interface definition for clarity (optional, but good practice)
interface RouteContext {
    params: { id: string };
}

// --- PATCH: Update Collection by ID ---
export async function PATCH(request: Request, { params }: RouteContext) {
    await dbConnect();

    // FIX: AWAIT the params object to handle it being a Promise in some Next.js environments.
    const { id } = await params;

    try {
        const body = await request.json();

        // Save base64 images if provided and merge with existing
        if (body.imagesBase64) {
            const saved: string[] = [];
            const log = reqLogger();
            for (const data of (body.imagesBase64 as string[])) {
                try {
                    const url = await saveBase64Image(data, { folder: 'collections' } as any);
                    saved.push(url);
                } catch (e) {
                    log.error({ err: e }, 'Failed to save collection image');
                }
            }

            const existing = await Collection.findById(id);
            const existingImages: string[] = (existing && existing.images) || [];
            body.images = existingImages.concat(saved);
            delete body.imagesBase64;
        }

        // Remove empty strings for optional fields if necessary (optional improvement)
        const cleanBody = Object.fromEntries(
            Object.entries(body).filter(([_, value]) => value !== '')
        );

        const updatedCollection = await Collection.findByIdAndUpdate(id, cleanBody, {
            new: true,
            runValidators: true
        });

        if (!updatedCollection) {
            return NextResponse.json({ message: "Collection not found" }, { status: 404 });
        }
        return NextResponse.json(updatedCollection, { status: 200 });

    } catch (error: any) {
        const reqId = request.headers.get('x-request-id') ?? generateRequestId();
        const log = reqLogger(reqId);
        log.error({ err: error }, 'PATCH collection error');

        // Detailed error message for validation failures
        let errorMessage = error.message;
        if (error.errors) {
            errorMessage = Object.values(error.errors).map((err: any) => err.message).join('; ');
        }

        return jsonResponse({
            message: errorMessage || "Failed to update collection",
            error: error.message
        }, 400, reqId);
    }
}

// --- DELETE: Delete Collection by ID ---
export async function DELETE(request: Request, { params }: RouteContext) {
    await dbConnect();

    // FIX: AWAIT the params object to handle it being a Promise.
    const { id } = await params;

    try {
        const deletedCollection = await Collection.findByIdAndDelete(id);

        if (!deletedCollection) {
            return NextResponse.json({ message: "Collection not found" }, { status: 404 });
        }

        // Standard REST response for successful deletion with no content
        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        const reqId = request.headers.get('x-request-id') ?? generateRequestId();
        const log = reqLogger(reqId);
        log.error({ err: error }, 'DELETE collection error');
        return jsonResponse({ message: "Failed to delete collection" }, 500, reqId);
    }
}