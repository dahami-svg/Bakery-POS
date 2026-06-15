import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProductDiscount from '@/models/ProductDiscount';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ success: false, message: 'tenantId query parameter is required' }, { status: 400 });
    }

    const discounts = await ProductDiscount.find({ tenantId }).sort({ startsAt: -1, createdAt: -1 });
    return NextResponse.json({ success: true, data: discounts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product discounts', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const tenantId = String(body.tenantId || '').trim();
    const title = String(body.title || '').trim();
    const mode = body.mode === 'fixed_price' ? 'fixed_price' : 'percentage';
    const value = Number(body.value || 0);
    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const endsAt = body.endsAt ? new Date(body.endsAt) : null;
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.map((id: unknown) => String(id || '').trim()).filter(Boolean)
      : [];

    if (!tenantId || !title || productIds.length === 0 || !startsAt || !endsAt || Number.isNaN(value)) {
      return NextResponse.json({ success: false, message: 'Missing required discount fields' }, { status: 400 });
    }

    if (startsAt > endsAt) {
      return NextResponse.json({ success: false, message: 'End date must be after the start date.' }, { status: 400 });
    }

    const discount = await ProductDiscount.create({
      tenantId,
      title,
      productIds,
      mode,
      value,
      startsAt,
      endsAt,
    });

    return NextResponse.json({ success: true, data: discount }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to create discount', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ success: false, message: 'Discount ID is required' }, { status: 400 });
    }

    const discount = await ProductDiscount.findById(body.id);
    if (!discount) {
      return NextResponse.json({ success: false, message: 'Discount not found' }, { status: 404 });
    }

    if (body.title !== undefined) discount.title = String(body.title || '').trim();
    if (body.mode !== undefined) discount.mode = body.mode === 'fixed_price' ? 'fixed_price' : 'percentage';
    if (body.value !== undefined) discount.value = Number(body.value || 0);
    if (body.productIds !== undefined && Array.isArray(body.productIds)) {
      discount.productIds = body.productIds.map((id: unknown) => String(id || '').trim()).filter(Boolean) as any;
    }
    if (body.startsAt !== undefined) discount.startsAt = new Date(body.startsAt);
    if (body.endsAt !== undefined) discount.endsAt = new Date(body.endsAt);

    if (discount.startsAt > discount.endsAt) {
      return NextResponse.json({ success: false, message: 'End date must be after the start date.' }, { status: 400 });
    }

    await discount.save();

    return NextResponse.json({ success: true, data: discount });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to update discount', error: error.message },
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
      return NextResponse.json({ success: false, message: 'Discount ID is required' }, { status: 400 });
    }

    const discount = await ProductDiscount.findByIdAndDelete(id);
    if (!discount) {
      return NextResponse.json({ success: false, message: 'Discount not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Discount deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete discount', error: error.message },
      { status: 500 }
    );
  }
}
