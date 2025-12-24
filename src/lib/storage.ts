import fs from 'fs';
import path from 'path';
import { env } from './env';
import { reqLogger } from './logger';

// Minimal S3 helper that uses AWS SDK v3 when S3 env vars are present.
// If S3 is not configured, falls back to writing files into public/images.

export async function saveBase64Image(base64Data: string, opts?: { folder?: string }) {
    const log = reqLogger();
    // data URI: data:<mime>;base64,<data>
    const matches = base64Data.match(/^data:(image\/[^;]+);base64,(.+)$/);
    let mime = 'image/png';
    let data = base64Data;
    if (matches) {
        mime = matches[1];
        data = matches[2];
    }
    const ext = mime.split('/')[1] || 'png';
    const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const keyPath = opts && opts.folder ? `${opts.folder}/${fileName}` : `images/${fileName}`;

    // If S3 configured, upload to S3
    if (env.S3_BUCKET && env.S3_REGION && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
        try {
            const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
            const client = new S3Client({ region: env.S3_REGION, endpoint: process.env.S3_ENDPOINT || undefined });
            const buf = Buffer.from(data, 'base64');
            const cmd = new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: keyPath, Body: buf, ContentType: mime, ACL: 'public-read' });
            await client.send(cmd);
            // Construct public URL (best-effort)
            const url = process.env.S3_ENDPOINT ? `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${env.S3_BUCKET}/${keyPath}` : `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${keyPath}`;
            return url;
        } catch (e) {
            log.error({ err: e }, 'S3 upload failed, falling back to local');
            // fall through to local save
        }
    }

    // Local fallback
    try {
        const imagesDir = path.join(process.cwd(), 'public', 'images');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
        const filePath = path.join(imagesDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
        return `/images/${fileName}`;
    } catch (e) {
        log.error({ err: e }, 'Failed to save local image');
        throw e;
    }
}

export async function deleteImageByPath(urlOrPath: string) {
    const log = reqLogger();
    if (!urlOrPath) return;
    // If it's an S3 URL, try to parse the key
    try {
        if (env.S3_BUCKET && urlOrPath.includes(env.S3_BUCKET)) {
            const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
            const client = new S3Client({ region: env.S3_REGION, endpoint: process.env.S3_ENDPOINT || undefined });
            // try to extract key after bucket
            const idx = urlOrPath.indexOf(env.S3_BUCKET);
            const key = urlOrPath.slice(idx + env.S3_BUCKET.length + 1).replace(/^\//, '');
            await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
            return true;
        }
    } catch (e) {
        log.error({ err: e }, 'Failed to delete S3 image');
        // continue to try local delete
    }

    // Local delete fallback
    try {
        const publicPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
        const abs = path.join(process.cwd(), 'public', publicPath);
        if (!abs.startsWith(path.join(process.cwd(), 'public', 'images'))) {
            log.warn({ path: abs }, 'Attempt to delete outside images dir blocked');
            return false;
        }
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
        return true;
    } catch (e) {
        log.error({ err: e }, 'Failed to delete local image');
        return false;
    }
}
