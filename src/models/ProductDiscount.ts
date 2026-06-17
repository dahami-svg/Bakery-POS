import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductDiscount extends Document {
  tenantId: mongoose.Types.ObjectId;
  title: string;
  productIds: mongoose.Types.ObjectId[];
  mode: 'percentage' | 'fixed_price';
  value: number;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductDiscountSchema: Schema = new Schema<IProductDiscount>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    title: { type: String, required: true, trim: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product', required: true }],
    mode: { type: String, enum: ['percentage', 'fixed_price'], required: true, default: 'percentage' },
    value: { type: Number, required: true, min: 0, default: 0 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const ProductDiscount: Model<IProductDiscount> =
  mongoose.models.ProductDiscount || mongoose.model<IProductDiscount>('ProductDiscount', ProductDiscountSchema);

export default ProductDiscount;
