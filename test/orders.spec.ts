import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Order from '@/models/Orders';

import { POST } from '@/app/api/orders/route';

// Note: install dev dependency before running tests:
// npm i -D mongodb-memory-server

let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
    await dbConnect();
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
});

describe('orders - transactional behavior', () => {
    it('prevents double-selling with concurrent orders', async () => {
        // Create a product with quantity 1
        const p = await Product.create({ name: 'Test', price: 100, imageUrl: '', quantity: 1, category: 'men' } as any);

        const payload = {
            items: [{ productId: String(p._id), name: p.name, price: p.price, qty: 1 }],
            email: 'test@example.com',
            firstName: 'A',
            lastName: 'B',
            address: 'street',
            city: 'city',
            postal: '0000',
            phone: '1234',
            country: 'PK',
            deliveryOption: 'standard',
            paymentMethod: 'cod',
            newsletter: false
        };

        // Two concurrent attempts
        const req1 = new Request('http://localhost/api/orders', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
        const req2 = new Request('http://localhost/api/orders', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });

        const [res1, res2] = await Promise.all([POST(req1), POST(req2)]);

        const status1 = (res1 as any).status || (res1 as any).statusCode;
        const status2 = (res2 as any).status || (res2 as any).statusCode;

        // Expect one success and one failure
        expect([status1, status2].sort()).toEqual([201, 400]);

        // product quantity should be 0
        const updated = await Product.findById(p._id);
        expect(updated?.quantity).toBe(0);

        // Only one order in DB
        const count = await Order.countDocuments({});
        expect(count).toBe(1);
    });
});