import mongoose, { Document, Schema } from 'mongoose';

export interface ICollection extends Document {
    name: string;
    slug: string;
    images?: string[];
}

const CollectionSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    images: { type: [String], default: [] },
}, {
    timestamps: true
});

const Collection = (mongoose.models.Collection ||
    mongoose.model<ICollection>('Collection', CollectionSchema)) as mongoose.Model<ICollection>;

export default Collection;