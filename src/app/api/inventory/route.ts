import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import InventoryItem from '@/models/InventoryItem';
import { resolveEntityCodes } from '@/lib/barcodes';

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

    const items = await InventoryItem.find({ tenantId });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch inventory items', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.tenantId || !body.name || !body.category || body.currentStock === undefined || !body.unit) {
      return NextResponse.json(
        { success: false, message: 'Missing required inventory fields' },
        { status: 400 }
      );
    }

    const item = await InventoryItem.create({
      tenantId: body.tenantId,
      name: body.name,
      category: body.category,
      currentStock: body.currentStock,
      ...(await resolveEntityCodes({
        model: InventoryItem,
        tenantId: String(body.tenantId),
        name: String(body.name),
        prefix: 'INV',
        sku: body.sku,
        barcode: body.barcode,
      })),
      unit: body.unit,
      bestBefore: body.bestBefore || 'N/A',
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    const duplicateField = error?.code === 11000 ? Object.keys(error?.keyPattern || {})[0] : null;
    return NextResponse.json(
      {
        success: false,
        message: duplicateField ? `That ${duplicateField} is already used in this shop.` : 'Failed to create inventory item',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, currentStock, name, category, unit, bestBefore, sku, barcode } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Item ID is required' },
        { status: 400 }
      );
    }

    const item = await InventoryItem.findById(id);
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Inventory item not found' },
        { status: 404 }
      );
    }

    if (currentStock !== undefined) item.currentStock = currentStock;
    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;
    if (unit !== undefined) item.unit = unit;
    if (bestBefore !== undefined) item.bestBefore = bestBefore;
    if (sku !== undefined || barcode !== undefined) {
      const resolvedCodes = await resolveEntityCodes({
        model: InventoryItem,
        tenantId: String(item.tenantId),
        name: String(name ?? item.name),
        prefix: 'INV',
        sku: sku ?? item.sku,
        barcode: barcode ?? item.barcode,
        excludeId: String(item._id),
      });
      item.sku = resolvedCodes.sku;
      item.barcode = resolvedCodes.barcode;
      item.barcodeType = resolvedCodes.barcodeType;
    }

    await item.save();

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    const duplicateField = error?.code === 11000 ? Object.keys(error?.keyPattern || {})[0] : null;
    return NextResponse.json(
      {
        success: false,
        message: duplicateField ? `That ${duplicateField} is already used in this shop.` : 'Failed to update inventory item',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Item ID is required' },
        { status: 400 }
      );
    }

    const item = await InventoryItem.findByIdAndDelete(id);
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete inventory item', error: error.message },
      { status: 500 }
    );
  }
}
