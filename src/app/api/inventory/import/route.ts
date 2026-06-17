import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import InventoryItem from '@/models/InventoryItem';
import { resolveEntityCodes } from '@/lib/barcodes';

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

    const docs = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const name = String(row.name || '').trim();
      const category = String(row.category || '').trim();
      const unit = String(row.unit || '').trim();
      const bestBefore = String(row.bestBefore || '').trim() || 'N/A';
      const currentStock = Number(row.currentStock);

      if (!name || !category || !unit || Number.isNaN(currentStock)) {
        throw new Error(`Inventory import row ${index + 1} is invalid.`);
      }

      docs.push({
        tenantId,
        name,
        category,
        unit,
        bestBefore,
        currentStock,
        ...(await resolveEntityCodes({
          model: InventoryItem,
          tenantId,
          name,
          prefix: 'INV',
          sku: row.sku,
          barcode: row.barcode,
        })),
      });
    }

    const inserted = await InventoryItem.insertMany(docs);

    return NextResponse.json({
      success: true,
      message: `${inserted.length} inventory items imported successfully.`,
      data: inserted,
    });
  } catch (error: any) {
    const duplicateField = error?.code === 11000 ? Object.keys(error?.keyPattern || {})[0] : null;
    return NextResponse.json(
      {
        success: false,
        message: duplicateField ? `Import failed because a ${duplicateField} is already used in this shop.` : 'Failed to import inventory items.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
