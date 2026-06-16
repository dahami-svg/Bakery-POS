import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import { resolveEntityCodes } from '@/lib/barcodes';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/excel-import';

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
      return NextResponse.json({ success: false, message: 'No product rows were provided.' }, { status: 400 });
    }

    const docs = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const name = String(row.name || '').trim();
      const category = String(row.category || '').trim();
      const unit = String(row.unit || '').trim();
      const image = String(row.image || '').trim() || DEFAULT_PRODUCT_IMAGE;
      const price = Number(row.price);
      const discountedPrice =
        row.discountedPrice === undefined || row.discountedPrice === null || row.discountedPrice === ''
          ? null
          : Number(row.discountedPrice);

      if (!name || !category || !unit || Number.isNaN(price)) {
        throw new Error(`Product import row ${index + 1} is invalid.`);
      }

      docs.push({
        tenantId,
        name,
        category,
        unit,
        image,
        price,
        discountedPrice: discountedPrice !== null && Number.isNaN(discountedPrice) ? null : discountedPrice,
        ...(await resolveEntityCodes({
          model: Product,
          tenantId,
          name,
          prefix: 'PRD',
          sku: row.sku,
          barcode: row.barcode,
        })),
      });
    }

    const inserted = await Product.insertMany(docs);

    return NextResponse.json({
      success: true,
      message: `${inserted.length} products imported successfully.`,
      data: inserted,
    });
  } catch (error: any) {
    const duplicateField = error?.code === 11000 ? Object.keys(error?.keyPattern || {})[0] : null;
    return NextResponse.json(
      {
        success: false,
        message: duplicateField ? `Import failed because a ${duplicateField} is already used in this shop.` : 'Failed to import products.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
