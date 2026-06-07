import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

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

    return NextResponse.json({ success: true, user: user.toJSON() });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }
}
