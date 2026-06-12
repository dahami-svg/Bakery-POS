import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Tenant from '@/models/Tenant';
import Product from '@/models/Product';
import InventoryItem from '@/models/InventoryItem';
import Order from '@/models/Order';
import WasteEntry from '@/models/WasteEntry';
import User from '@/models/User';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const role = req.headers.get('x-user-role') || '';
    const userTenantId = req.headers.get('x-user-tenant-id') || '';

    const feeOnlyUpdate =
      body.feePresets !== undefined &&
      body.name === undefined &&
      body.enabledModules === undefined &&
      body.logoUrl === undefined &&
      body.type === undefined;

    if (role !== 'super_admin') {
      const canManageOwnFeePresets =
        role === 'tenant_admin' && feeOnlyUpdate && userTenantId === id;

      if (!canManageOwnFeePresets) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    }

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
    if (body.feePresets !== undefined && Array.isArray(body.feePresets)) {
      tenant.feePresets = body.feePresets
        .map((fee: any) => ({
          label: String(fee.label || '').trim(),
          mode: fee.mode === 'percentage' ? 'percentage' : 'fixed',
          value: Number(fee.value ?? fee.amount ?? 0),
          amount: Number(fee.amount || 0),
        }))
        .filter((fee: { label: string; mode: 'fixed' | 'percentage'; value: number; amount: number }) => fee.label);
    }

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
    const connection = await dbConnect();
    const { id } = await params;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      );
    }

    const session = await connection.startSession();

    try {
      await session.withTransaction(async () => {
        await Promise.all([
          Product.deleteMany({ tenantId: id }).session(session),
          InventoryItem.deleteMany({ tenantId: id }).session(session),
          Order.deleteMany({ tenantId: id }).session(session),
          WasteEntry.deleteMany({ tenantId: id }).session(session),
          User.deleteMany({ tenantId: id }).session(session),
        ]);

        await Tenant.findByIdAndDelete(id).session(session);
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete tenant', error: error.message },
      { status: 500 }
    );
  }
}
