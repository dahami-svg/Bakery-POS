import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { hashPasswordSetupToken } from '@/lib/password-setup';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token is required.' }, { status: 400 });
    }

    const tokenHash = hashPasswordSetupToken(token);
    const user = await User.findOne({
      passwordSetupTokenHash: tokenHash,
      passwordSetupExpiresAt: { $gt: new Date() },
    }).select('name email');

    if (!user) {
      return NextResponse.json({ success: false, message: 'This setup link is invalid or expired.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to validate setup link.', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const token = String(body.token || '').trim();
    const password = String(body.password || '');

    if (!token || !password) {
      return NextResponse.json({ success: false, message: 'Token and password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const tokenHash = hashPasswordSetupToken(token);
    const user = await User.findOne({
      passwordSetupTokenHash: tokenHash,
      passwordSetupExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'This setup link is invalid or expired.' }, { status: 404 });
    }

    user.password = password;
    user.passwordSetupRequired = false;
    user.passwordSetupTokenHash = null;
    user.passwordSetupExpiresAt = null;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password created successfully. You can sign in now.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to create password.', error: error.message },
      { status: 500 }
    );
  }
}
