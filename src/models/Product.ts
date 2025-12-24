import mongoose, { Document, Schema, Model } from 'mongoose';

// 1. Define the TypeScript Interface for the Product Document
export interface IProduct extends Document {
    name: string;
    price: number;
    imageUrl?: string;
    featureImage?: string; // ✅ Feature image (single) to be used as primary product image
    category: 'men' | 'women' | string;
    description: string;
    quantity: number;
    // --- NEW FIELD ADDED ---
    collectionSlug: string; // Used to group products (e.g., 'dominus', 'artemis')
    images?: string[];
    type?: 'tester' | '50ml' | string;
}

// 2. Define the Mongoose Schema
const ProductSchema: Schema<IProduct> = new Schema({
    name: {
        type: String,
        required: [true, 'Product name is required.'],
        trim: true,
    },
    featureImage: {
        type: String,
        required: false,
    },
    price: {
        type: Number,
        required: [true, 'Product price is required.'],
        min: 0,
    },
    imageUrl: {
        type: String,
        required: false,
    },
    category: {
        type: String,
        required: [true, 'Product category is required.'],
        enum: ['men', 'women', 'unisex'], // Example constraints
    },
    description: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    images: {
        type: [String],
        default: [],
    },
    type: {
        type: String,
        enum: ['tester', '50ml'],
        default: '50ml',
    },
    // --- NEW FIELD DEFINITION ---
    collectionSlug: {
        type: String,
        required: [true, 'Collection slug is required.'],
        trim: true,
        lowercase: true,
        // Allows searching products based on the slug provided in the URL
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

// 3. Create the Model
// Use existing model if it's already defined to prevent Mongoose error
const Product: Model<IProduct> = (mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)) as Model<IProduct>;

export default Product;