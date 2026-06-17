import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Tenant from '@/models/Tenant';
import Product from '@/models/Product';
import InventoryItem from '@/models/InventoryItem';
import Order from '@/models/Order';
import WasteEntry from '@/models/WasteEntry';
import User from '@/models/User';
import { normalizePosOrderTypes } from '@/lib/pos-order-types';

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
      body.contactEmail === undefined &&
      body.contactPhone === undefined &&
      body.addressLine1 === undefined &&
      body.addressLine2 === undefined &&
      body.city === undefined &&
      body.ownerName === undefined &&
      body.ownerEmail === undefined &&
      body.enabledModules === undefined &&
      body.posOrderTypes === undefined &&
      body.logoUrl === undefined &&
      body.type === undefined &&
      body.isActive === undefined;

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

    if (body.name !== undefined) tenant.name = String(body.name).trim();
    if (body.contactEmail !== undefined) tenant.contactEmail = String(body.contactEmail).trim().toLowerCase();
    if (body.contactPhone !== undefined) tenant.contactPhone = String(body.contactPhone).trim();
    if (body.addressLine1 !== undefined) tenant.addressLine1 = String(body.addressLine1).trim();
    if (body.addressLine2 !== undefined) tenant.addressLine2 = String(body.addressLine2).trim();
    if (body.city !== undefined) tenant.city = String(body.city).trim();
    if (body.enabledModules !== undefined) tenant.enabledModules = body.enabledModules;
    if (body.logoUrl !== undefined) tenant.logoUrl = String(body.logoUrl).trim();
    if (body.type !== undefined) tenant.type = body.type;
    if (body.isActive !== undefined) tenant.isActive = Boolean(body.isActive);
    if (body.posOrderTypes !== undefined || body.enabledModules !== undefined || body.type !== undefined) {
      tenant.posOrderTypes = normalizePosOrderTypes(
        body.posOrderTypes ?? tenant.posOrderTypes,
        body.type ?? tenant.type,
        body.enabledModules ?? tenant.enabledModules
      );
    }
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

    if (body.ownerName !== undefined || body.ownerEmail !== undefined) {
      const ownerUser = await User.findOne({ tenantId: id, role: 'tenant_admin' });
      if (!ownerUser) {
        return NextResponse.json(
          { success: false, message: 'Tenant owner account not found' },
          { status: 404 }
        );
      }

      if (body.ownerName !== undefined) {
        const nextOwnerName = String(body.ownerName).trim();
        tenant.ownerName = nextOwnerName;
        ownerUser.name = nextOwnerName;
      }

      if (body.ownerEmail !== undefined) {
        const nextOwnerEmail = String(body.ownerEmail).trim().toLowerCase();
        if (nextOwnerEmail !== ownerUser.email) {
          const existingUser = await User.findOne({
            email: nextOwnerEmail,
            _id: { $ne: ownerUser._id },
          });

          if (existingUser) {
            return NextResponse.json(
              { success: false, message: 'A user with this owner email already exists.' },
              { status: 409 }
            );
          }
        }

        tenant.ownerEmail = nextOwnerEmail;
        ownerUser.email = nextOwnerEmail;
      }

      await ownerUser.save();
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
