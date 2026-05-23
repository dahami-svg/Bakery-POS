import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWasteEntry extends Document {
  tenantId: mongoose.Types.ObjectId;
  ingredientId: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  createdAt: Date;
}

const WasteEntrySchema: Schema = new Schema<IWasteEntry>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    ingredientId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

const WasteEntry: Model<IWasteEntry> =
  mongoose.models.WasteEntry ||
  mongoose.model<IWasteEntry>('WasteEntry', WasteEntrySchema);

export default WasteEntry;
