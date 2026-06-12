import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITenant extends Document {
  feePresets: {
    label: string;
    mode: 'fixed' | 'percentage';
    value: number;
    amount: number;
  }[];
  name: string;
  type: 'bakery' | 'restaurant' | 'hardware' | 'cake_shop';
  enabledModules: ('analytics' | 'pos' | 'kds' | 'inventory')[];
  logoUrl?: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema: Schema = new Schema<ITenant>(
  {
    feePresets: {
      type: [
        new Schema(
          {
            label: { type: String, required: true, trim: true },
            mode: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
            value: { type: Number, required: true, default: 0 },
            amount: { type: Number, required: true, default: 0 },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['bakery', 'restaurant', 'hardware', 'cake_shop'],
    },
    enabledModules: {
      type: [String],
      required: true,
      default: ['analytics', 'pos'],
      enum: ['analytics', 'pos', 'kds', 'inventory'],
    },
    logoUrl: { type: String },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    ownerEmail: { type: String, required: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

// Prevent compiling model multiple times in Next.js hot-reloads
const Tenant: Model<ITenant> =
  mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);

export default Tenant;
