import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInventoryItem extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  currentStock: number;
  sku?: string;
  barcode?: string;
  barcodeType?: 'CODE128' | 'EAN13' | 'QR';
  unit: string;
  bestBefore?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema: Schema = new Schema<IInventoryItem>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    currentStock: { type: Number, required: true, default: 0 },
    sku: { type: String, trim: true },
    barcode: { type: String, trim: true },
    barcodeType: {
      type: String,
      enum: ['CODE128', 'EAN13', 'QR'],
      default: 'CODE128',
    },
    unit: { type: String, required: true },
    bestBefore: { type: String },
  },
  { timestamps: true }
);

InventoryItemSchema.index({ tenantId: 1, sku: 1 }, { unique: true, sparse: true });
InventoryItemSchema.index({ tenantId: 1, barcode: 1 }, { unique: true, sparse: true });

const InventoryItem: Model<IInventoryItem> =
  mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);

export default InventoryItem;
