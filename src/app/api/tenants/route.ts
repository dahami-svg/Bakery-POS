import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import { createPasswordSetupToken } from '@/lib/password-setup';
import { sendTenantInvitationEmail } from '@/lib/mail';
import { normalizePosOrderTypes } from '@/lib/pos-order-types';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const role = req.headers.get('x-user-role') || '';
    const tenantId = req.headers.get('x-user-tenant-id') || '';

    let tenants;
    if (role === 'super_admin') {
      tenants = await Tenant.find({}).sort({ name: 1 });
    } else {
      tenants = await Tenant.find({ _id: tenantId }).sort({ name: 1 });
    }

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

    const requiredFields = [
      'name',
      'type',
      'contactEmail',
      'contactPhone',
      'addressLine1',
      'city',
      'ownerName',
      'ownerEmail',
    ];

    const missingField = requiredFields.find((field) => !String(body[field] || '').trim());

    if (missingField) {
      return NextResponse.json(
        { success: false, message: `${missingField} is required` },
        { status: 400 }
      );
    }

    const ownerEmail = String(body.ownerEmail).trim().toLowerCase();
    const contactEmail = String(body.contactEmail).trim().toLowerCase();
    const enabledModules = Array.isArray(body.enabledModules) ? body.enabledModules : ['analytics', 'pos'];

    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'A user with this owner email already exists.' },
        { status: 409 }
      );
    }

    const { rawToken, tokenHash, expiresAt } = createPasswordSetupToken();

    const tenant = await Tenant.create({
      name: String(body.name).trim(),
      type: body.type,
      isActive: true,
      enabledModules,
      posOrderTypes: normalizePosOrderTypes(body.posOrderTypes, body.type, enabledModules),
      logoUrl: body.logoUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop',
      contactEmail,
      contactPhone: String(body.contactPhone).trim(),
      addressLine1: String(body.addressLine1).trim(),
      addressLine2: String(body.addressLine2 || '').trim(),
      city: String(body.city).trim(),
      ownerName: String(body.ownerName).trim(),
      ownerEmail,
    });

    const ownerUser = await User.create({
      name: String(body.ownerName).trim(),
      email: ownerEmail,
      password: rawToken,
      role: 'tenant_admin',
      tenantId: tenant._id,
      passwordSetupRequired: true,
      passwordSetupTokenHash: tokenHash,
      passwordSetupExpiresAt: expiresAt,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || req.nextUrl.origin;
    const setupUrl = `${appUrl}/setup-password?token=${rawToken}`;

    let emailDelivery: { delivered: boolean; provider: string; error?: string } = {
      delivered: false,
      provider: 'none',
    };

    try {
      const result = await sendTenantInvitationEmail({
        ownerName: ownerUser.name,
        ownerEmail: ownerUser.email,
        shopName: tenant.name,
        setupUrl,
      });
      emailDelivery = result;
    } catch (error: any) {
      emailDelivery = {
        delivered: false,
        provider: 'resend',
        error: error.message,
      };
    }

    return NextResponse.json(
      {
        success: true,
        data: tenant,
        invitation: {
          ownerEmail,
          setupUrl,
          emailDelivered: emailDelivery.delivered,
          emailError: emailDelivery.error || null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to create tenant', error: error.message },
      { status: 500 }
    );
  }
}
