import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import InventoryItem from '@/models/InventoryItem';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const tenantId = String(body.tenantId || '').trim();
    const rows = Array.isArray(body.rows) ? body.rows : [];

    if (!tenantId) {
      return NextResponse.json({ success: false, message: 'tenantId is required.' }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'No inventory rows were provided.' }, { status: 400 });
    }

    const docs = rows.map((row: any, index: number) => {
      const name = String(row.name || '').trim();
      const category = String(row.category || '').trim();
      const unit = String(row.unit || '').trim();
      const bestBefore = String(row.bestBefore || '').trim() || 'N/A';
      const currentStock = Number(row.currentStock);

      if (!name || !category || !unit || Number.isNaN(currentStock)) {
        throw new Error(`Inventory import row ${index + 1} is invalid.`);
      }

      return {
        tenantId,
        name,
        category,
        unit,
        bestBefore,
        currentStock,
      };
    });

    const inserted = await InventoryItem.insertMany(docs);

    return NextResponse.json({
      success: true,
      message: `${inserted.length} inventory items imported successfully.`,
      data: inserted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to import inventory items.', error: error.message },
      { status: 500 }
    );
  }
}
