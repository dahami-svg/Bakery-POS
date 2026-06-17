import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  price: number;
  discountedPrice?: number | null;
  sku?: string;
  barcode?: string;
  barcodeType?: 'CODE128' | 'EAN13' | 'QR';
  image: string;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema<IProduct>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    discountedPrice: { type: Number, default: null },
    sku: { type: String, trim: true },
    barcode: { type: String, trim: true },
    barcodeType: {
      type: String,
      enum: ['CODE128', 'EAN13', 'QR'],
      default: 'CODE128',
    },
    image: { type: String, required: true },
    unit: { type: String, required: true },
  },
  { timestamps: true }
);

ProductSchema.index({ tenantId: 1, sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ tenantId: 1, barcode: 1 }, { unique: true, sparse: true });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
