import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Tenant from '@/models/Tenant';

export async function GET() {
  try {
    await dbConnect();
    const tenants = await Tenant.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: tenants });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tenants', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    if (!body.name || !body.type) {
      return NextResponse.json(
        { success: false, message: 'Name and type are required' },
        { status: 400 }
      );
    }

    const tenant = await Tenant.create({
      name: body.name,
      type: body.type,
      enabledModules: body.enabledModules || ['analytics', 'pos'],
      logoUrl: body.logoUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop',
    });

    return NextResponse.json({ success: true, data: tenant }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to create tenant', error: error.message },
      { status: 500 }
    );
  }
}
