import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Tenant from '@/models/Tenant';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    await dbConnect();
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'super_admin' && user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId).select('isActive');
      if (tenant && tenant.isActive === false) {
        return NextResponse.json({ success: false, message: 'Tenant is deactivated' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, user: user.toJSON() });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }
}
