import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  note?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
}

export interface IOrder extends Document {
  tenantId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  type: 'dine-in' | 'takeaway' | 'delivery' | 'quick-sale';
  tableNumber?: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  note: { type: String },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'preparing', 'ready', 'delivered'],
    default: 'pending',
  },
});

const OrderSchema: Schema = new Schema<IOrder>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    items: { type: [OrderItemSchema], required: true },
    status: {
      type: String,
      required: true,
      enum: ['new', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'new',
    },
    type: {
      type: String,
      required: true,
      enum: ['dine-in', 'takeaway', 'delivery', 'quick-sale'],
      default: 'quick-sale',
    },
    tableNumber: { type: Number },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
