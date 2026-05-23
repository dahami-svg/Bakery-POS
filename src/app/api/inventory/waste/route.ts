import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WasteEntry from '@/models/WasteEntry';
import InventoryItem from '@/models/InventoryItem';

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

    const wasteEntries = await WasteEntry.find({ tenantId })
      .populate('ingredientId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: wasteEntries });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch waste entries', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.tenantId || !body.ingredientId || body.amount === undefined || !body.reason) {
      return NextResponse.json(
        { success: false, message: 'Missing required waste log fields' },
        { status: 400 }
      );
    }

    // Check if ingredient exists
    const item = await InventoryItem.findById(body.ingredientId);
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Create waste entry
    const waste = await WasteEntry.create({
      tenantId: body.tenantId,
      ingredientId: body.ingredientId,
      amount: body.amount,
      reason: body.reason,
    });

    // Deduct stock from the inventory item (allowing it to go to 0, but clamp it to prevent negative stock if desired)
    item.currentStock = Math.max(0, item.currentStock - body.amount);
    await item.save();

    const populatedWaste = await WasteEntry.findById(waste._id).populate('ingredientId');

    return NextResponse.json({ success: true, data: populatedWaste }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to log waste entry', error: error.message },
      { status: 500 }
    );
  }
}
