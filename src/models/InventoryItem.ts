import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInventoryItem extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  currentStock: number;
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
    unit: { type: String, required: true },
    bestBefore: { type: String },
  },
  { timestamps: true }
);

const InventoryItem: Model<IInventoryItem> =
  mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);

export default InventoryItem;
