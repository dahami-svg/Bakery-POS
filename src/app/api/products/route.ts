import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
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

    const products = await Product.find({ tenantId });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.tenantId || !body.name || !body.category || !body.price || !body.image || !body.unit) {
      return NextResponse.json(
        { success: false, message: 'Missing required product fields' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      tenantId: body.tenantId,
      name: body.name,
      category: body.category,
      price: body.price,
      image: body.image,
      unit: body.unit,
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to create product', error: error.message },
      { status: 500 }
    );
  }
}
