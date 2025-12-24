import { z } from 'zod';

export const orderItemSchema = z.object({
    productId: z.string().optional(),
    name: z.string(),
    price: z.number(),
    qty: z.number().min(1),
    size: z.string().optional(),
});

export const createOrderSchema = z.object({
    items: z.array(orderItemSchema).nonempty(),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    postal: z.string().min(1),
    phone: z.string().min(1),
    country: z.string().min(1),
    deliveryOption: z.string().optional(),
    paymentMethod: z.string().optional(),
    newsletter: z.boolean().optional(),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'shipped', 'cancelled', 'paid', 'completed']).optional(),
});

export type CreateOrder = z.infer<typeof createOrderSchema>;
