import { z } from 'zod';

export const createProductSchema = z.object({
    name: z.string().min(1),
    price: z.number().nonnegative(),
    description: z.string().optional(),
    category: z.string().optional(),
    quantity: z.number().int().nonnegative().optional(),
    images: z.array(z.string()).optional(),
    imagesBase64: z.array(z.string()).optional(),
    featureImageBase64: z.string().optional(),
    featureImage: z.string().optional(),
    collectionSlug: z.string().optional(),
});

export type CreateProduct = z.infer<typeof createProductSchema>;
