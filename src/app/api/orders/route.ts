export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from '@/lib/db';
import Order from '@/models/Orders';
import Product from '@/models/Product';
import User from '@/models/Users';
import { sendMail } from '@/lib/mailer';
import jwt from 'jsonwebtoken';
import { reqLogger } from '@/lib/logger';
import { generateRequestId } from '@/lib/requestId';
import { jsonResponse } from '@/lib/response';
import { env } from '@/lib/env';
import { createOrderSchema } from '@/lib/validators/orders';

import { verifyTokenFromReq } from '@/lib/auth';

async function getUserFromReq(req: Request) {
    try {
        const payload: any = verifyTokenFromReq(req);
        return payload; // { id, role }
    } catch (e) {
        return null;
    }
}

export async function POST(req: Request) {
    const reqId = req.headers.get('x-request-id') ?? generateRequestId();
    const log = reqLogger(reqId);
    log.debug('orders.create called');

    await dbConnect();

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
        return jsonResponse({ error: 'Invalid request', details: parsed.error.format() }, 400, reqId);
    }

    const {
        items,
        email,
        firstName,
        lastName,
        address,
        city,
        postal,
        phone,
        country,
        deliveryOption,
        paymentMethod,
        newsletter,
    } = parsed.data;

    // Recalculate subtotal on the server to avoid tampering
    let subtotal = 0;
    for (const it of items) {
        const price = Number(it.price || 0);
        const qty = Number(it.qty || 0);
        if (!price || !qty) return jsonResponse({ error: 'Invalid item in cart' }, 400, reqId);
        subtotal += price * qty;
    }

    const shippingCost = (deliveryOption === 'standard' && items.length) ? 200 : 0;
    const total = subtotal + shippingCost;

    // Attach user if authenticated
    const userPayload = await getUserFromReq(req);
    const userId = userPayload?.id || undefined;

    // Try to perform the whole operation inside a MongoDB transaction when supported
    let order: any = null;
    try {
        const session = await (async () => {
            try {
                return await (await import('mongoose')).startSession();
            } catch (e) {
                log.debug('Transactions not supported in this environment, falling back to best-effort updates');
                return null;
            }
        })();

        if (session && typeof session.withTransaction === 'function') {
            await session.withTransaction(async () => {
                // Create order within transaction
                const orderDoc = await Order.create(
                    [{
                        user: userId,
                        items: items.map((it: any) => ({ productId: it.productId || undefined, name: it.name, price: Number(it.price), qty: Number(it.qty), size: it.size })),
                        shipping: { firstName, lastName, email, address, city, postal, phone, country },
                        subtotal,
                        shippingCost,
                        total,
                        deliveryOption: deliveryOption || 'standard',
                        paymentMethod: paymentMethod || 'cod',
                        newsletter: newsletter ? true : false,
                        status: 'pending',
                    }],
                    { session }
                );

                order = orderDoc[0];

                // Decrement stock safely inside transaction
                for (const it of items) {
                    if (!it.productId) continue;
                    const qty = Math.max(0, Number(it.qty || 0));
                    const res = await Product.updateOne({ _id: it.productId, quantity: { $gte: qty } }, { $inc: { quantity: -qty } }, { session });
                    if (res.matchedCount === 0 || res.modifiedCount === 0) {
                        throw new Error(`Insufficient stock for ${it.name}`);
                    }
                }

                // Attach order id to user within transaction if user exists
                if (userId) {
                    await User.updateOne({ _id: userId }, { $push: { orders: order._id } }, { session });
                }
            });

            await session.endSession();
        } else {
            // Fallback for single-node / dev environments without transactions
            // Create order first
            order = await Order.create({
                user: userId,
                items: items.map((it: any) => ({ productId: it.productId || undefined, name: it.name, price: Number(it.price), qty: Number(it.qty), size: it.size })),
                shipping: { firstName, lastName, email, address, city, postal, phone, country },
                subtotal,
                shippingCost,
                total,
                deliveryOption: deliveryOption || 'standard',
                paymentMethod: paymentMethod || 'cod',
                newsletter: newsletter ? true : false,
                status: 'pending',
            });

            if (userId) {
                try {
                    await User.findByIdAndUpdate(userId, { $push: { orders: order._id } }, { upsert: false });
                } catch (e) {
                    log.warn({ err: e }, 'Failed to attach order to user record (non-fatal)');
                }
            }

            // decrement stock atomically with rollback if any update fails
            const updatedProducts: { id: string; qty: number }[] = [];
            try {
                for (const it of items) {
                    if (!it.productId) continue;
                    const qty = Math.max(0, Number(it.qty || 0));
                    const updated = await Product.findOneAndUpdate(
                        { _id: it.productId, quantity: { $gte: qty } },
                        { $inc: { quantity: -qty } },
                        { new: true }
                    );
                    if (!updated) {
                        // rollback previous updates
                        for (const u of updatedProducts) {
                            await Product.findByIdAndUpdate(u.id, { $inc: { quantity: u.qty } });
                        }
                        return jsonResponse({ error: `Insufficient stock for ${it.name}` }, 400, reqId);
                    }
                    updatedProducts.push({ id: String(it.productId), qty });
                }
            } catch (err) {
                // rollback any partial updates
                for (const u of updatedProducts) {
                    try {
                        await Product.findByIdAndUpdate(u.id, { $inc: { quantity: u.qty } });
                    } catch (e) {
                        log.error({ err: e }, 'Rollback failed for product');
                    }
                }
                log.error({ err }, 'Stock update failed');
                return jsonResponse({ error: 'Failed to update product stock' }, 500, reqId);
            }
        }
    } catch (e: any) {
        log.warn({ err: e }, 'Order creation failed during transaction');
        if (String(e.message || '').toLowerCase().includes('insufficient stock')) {
            return jsonResponse({ error: e.message }, 400, reqId);
        }
        return jsonResponse({ error: 'Failed to create order' }, 500, reqId);
    }

    // If newsletter opted-in, mark user if exists (non-transactional, best-effort)
    try {
        if (newsletter) {
            const existing = await User.findOne({ email });
            if (existing) {
                existing.newsletter = true;
                await existing.save();
            }
        }
    } catch (e) {
        log.error({ err: e }, 'Failed to update newsletter flag');
    }

    // Send emails (non-blocking) — use HTML templates
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM || 'admin@example.com';
    const userEmail = email;

    try {
        const { userOrderHtml, adminOrderHtml } = await import('@/lib/emailTemplates');
        const userHtml = userOrderHtml(order);
        const adminHtml = adminOrderHtml(order);

        const sendResults = await Promise.allSettled([
            sendMail({ to: userEmail, subject: `Order Confirmation — ${order._id}`, text: `Thank you for your order ${order._id} - Total RS ${order.total}`, html: userHtml }),
            sendMail({ to: adminEmail, subject: `New Order — ${order._id}`, text: `New order placed ${order._id}`, html: adminHtml }),
        ]);

        sendResults.forEach((r, idx) => {
            if (r.status === 'rejected') log.error({ r }, idx === 0 ? 'User mail failed' : 'Admin mail failed');
        });
    } catch (e) {
        log.error({ err: e }, 'Failed to prepare/send emails');
    }

    log.info({ orderId: order._id, userId: userId || null, subtotal, total }, 'Order created');
    return jsonResponse({ orderId: order._id, message: 'Order created' }, 201, reqId);
}

export async function GET(req: Request) {
    await dbConnect();
    const userPayload = await getUserFromReq(req);
    if (!userPayload || userPayload.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json(orders, { status: 200 });
}
