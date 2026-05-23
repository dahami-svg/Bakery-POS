import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Tenant from '@/models/Tenant';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Update allowable fields
    if (body.name !== undefined) tenant.name = body.name;
    if (body.enabledModules !== undefined) tenant.enabledModules = body.enabledModules;
    if (body.logoUrl !== undefined) tenant.logoUrl = body.logoUrl;
    if (body.type !== undefined) tenant.type = body.type;

    await tenant.save();

    return NextResponse.json({ success: true, data: tenant });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to update tenant', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete tenant', error: error.message },
      { status: 500 }
    );
  }
}
