import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  type: 'bakery' | 'restaurant' | 'hardware' | 'cake_shop';
  enabledModules: ('analytics' | 'pos' | 'kds' | 'inventory')[];
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema: Schema = new Schema<ITenant>(
  {
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
  },
  { timestamps: true }
);

// Prevent compiling model multiple times in Next.js hot-reloads
const Tenant: Model<ITenant> =
  mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);

export default Tenant;
