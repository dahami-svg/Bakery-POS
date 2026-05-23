import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'tenantId query parameter is required' },
        { status: 400 }
      );
    }

    // Populate the product details for each item
    // We can use Mongoose populate. First make sure Product model is registered by importing it.
    const orders = await Order.find({ tenantId })
      .populate('items.productId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.tenantId || !body.items || body.items.length === 0 || body.total === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required order fields' },
        { status: 400 }
      );
    }

    const order = await Order.create({
      tenantId: body.tenantId,
      items: body.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        note: item.note || '',
        status: item.status || 'pending',
      })),
      status: body.status || 'new',
      type: body.type || 'quick-sale',
      tableNumber: body.tableNumber,
      total: body.total,
    });

    const populatedOrder = await Order.findById(order._id).populate('items.productId');

    return NextResponse.json({ success: true, data: populatedOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to create order', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, status, items } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (status !== undefined) {
      order.status = status;
      // If order is completed, set all items to ready/delivered
      if (status === 'completed') {
        order.items.forEach(item => {
          item.status = 'delivered';
        });
      }
    }

    if (items !== undefined && Array.isArray(items)) {
      // Update individual items by matching item ID or index
      items.forEach((updateItem: any) => {
        const existingItem = order.items.find(item => item._id?.toString() === updateItem.id);
        if (existingItem) {
          if (updateItem.status !== undefined) {
            existingItem.status = updateItem.status;
          }
        }
      });

      // If all items are 'ready' or 'delivered', automatically update order status if appropriate
      const allReady = order.items.every(item => item.status === 'ready' || item.status === 'delivered');
      if (allReady && order.status === 'preparing') {
        order.status = 'ready';
      }
    }

    await order.save();
    const populatedOrder = await Order.findById(order._id).populate('items.productId');

    return NextResponse.json({ success: true, data: populatedOrder });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to update order', error: error.message },
      { status: 500 }
    );
  }
}
