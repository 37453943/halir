import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    size: { type: String },
});

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    items: { type: [OrderItemSchema], required: true },
    shipping: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        postal: { type: String, required: true },
        phone: { type: String, required: true },
        country: { type: String, required: true },
    },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    deliveryOption: { type: String, enum: ['standard'], default: 'standard' },
    paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
    newsletter: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export default Order;
