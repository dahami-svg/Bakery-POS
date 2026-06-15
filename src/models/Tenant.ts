import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITenant extends Document {
  posOrderTypes: ('dine-in' | 'takeaway' | 'delivery' | 'walk-in' | 'quotation' | 'invoice' | 'quick-sale')[];
  feePresets: {
    label: string;
    mode: 'fixed' | 'percentage';
    value: number;
    amount: number;
  }[];
  name: string;
  type: 'bakery' | 'restaurant' | 'hardware' | 'cake_shop';
  isActive: boolean;
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
    isActive: { type: Boolean, required: true, default: true },
    enabledModules: {
      type: [String],
      required: true,
      default: ['analytics', 'pos'],
      enum: ['analytics', 'pos', 'kds', 'inventory'],
    },
    posOrderTypes: {
      type: [String],
      required: true,
      default: ['quick-sale', 'delivery', 'invoice'],
      enum: ['dine-in', 'takeaway', 'delivery', 'walk-in', 'quotation', 'invoice', 'quick-sale'],
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

const existingTenantModel = mongoose.models.Tenant as Model<ITenant> | undefined;

// In dev, Next.js can keep an older cached model after schema changes.
// This makes sure fields like isActive exist without requiring a manual restart.
if (existingTenantModel && !existingTenantModel.schema.path('isActive')) {
  existingTenantModel.schema.add({
    isActive: { type: Boolean, required: true, default: true },
  });
}

// Prevent compiling model multiple times in Next.js hot-reloads
const Tenant: Model<ITenant> =
  existingTenantModel || mongoose.model<ITenant>('Tenant', TenantSchema);

export default Tenant;
