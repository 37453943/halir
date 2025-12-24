import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Collection, { ICollection } from '@/models/Collections';
import fs from 'fs';
import path from 'path';
import { generateRequestId } from '@/lib/requestId';
import { reqLogger } from '@/lib/logger';
import { jsonResponse } from '@/lib/response';
import { saveBase64Image } from '@/lib/storage';

// GET: Read All Collections
export async function GET(request: Request) {
    const reqId = request.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);
    await dbConnect();
    try {
        const collections: ICollection[] = await Collection.find({}).sort({ name: 1 });
        return jsonResponse(collections, 200, reqId);
    } catch (error: any) {
        log.error({ err: error }, 'GET collections error');
        return jsonResponse({ message: "Failed to fetch collections" }, 500, reqId);
    }
}

// POST: Create a new Collection
export async function POST(request: Request) {
    const reqId = request.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);
    try {
        await dbConnect(); // Ensure DB is connected

        const body = await request.json();
        const { name, slug } = body; // Destructure ONLY the fields you want to save

        // Save base64 images if provided (use storage abstraction)
        const saveBase64Images = async (base64Arr?: string[]) => {
            if (!base64Arr || !Array.isArray(base64Arr) || base64Arr.length === 0) return [];
            const saved: string[] = [];
            for (const data of base64Arr) {
                try {
                    const url = await saveBase64Image(data, { folder: 'collections' } as any);
                    saved.push(url);
                } catch (e) {
                    log.error({ err: e }, 'Failed to save collection image');
                }
            }
            return saved;
        };

        let images: string[] = [];
        if (body.imagesBase64) {
            images = await saveBase64Images(body.imagesBase64);
        }

        // Mongoose document creation with only the necessary fields
        const newCollection = new Collection({
            name,
            slug,
            images,
            // tagline and description are explicitly omitted
        });

        await newCollection.save();

        return jsonResponse(newCollection, 201, reqId);

    } catch (error: any) {
        log.error({ err: error }, 'POST collection error');
        return jsonResponse({ message: "Failed to create collection", error: error.message }, 400, reqId);
    }
}