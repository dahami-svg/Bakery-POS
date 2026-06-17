import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyToken } from '@/lib/jwt';
import {
  isThemeMode,
  isThemePalette,
  normalizeLegacyThemePreference,
  normalizeThemeMode,
  normalizeThemePalette,
} from '@/lib/themes';
import User from '@/models/User';

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    const body = await req.json();
    const rawPalette = typeof body?.themePalette === 'string' ? body.themePalette : null;
    const rawMode = typeof body?.themeMode === 'string' ? body.themeMode : null;
    const rawLegacyTheme = typeof body?.theme === 'string' ? body.theme : null;

    if (!rawPalette && !rawMode && !rawLegacyTheme) {
      return NextResponse.json({ success: false, message: 'Theme preference is required' }, { status: 400 });
    }

    if (rawPalette && !isThemePalette(rawPalette)) {
      return NextResponse.json({ success: false, message: 'Invalid theme' }, { status: 400 });
    }

    if (rawMode && !isThemeMode(rawMode)) {
      return NextResponse.json({ success: false, message: 'Invalid theme mode' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const legacyPreference = normalizeLegacyThemePreference(rawLegacyTheme);
    const currentPalette = normalizeThemePalette(user.themePalette ?? user.theme ?? null);
    const currentMode = user.themeMode
      ? normalizeThemeMode(user.themeMode)
      : normalizeLegacyThemePreference(user.theme ?? null).mode;
    const requestedPalette = rawPalette
      ? normalizeThemePalette(rawPalette)
      : rawLegacyTheme
        ? legacyPreference.palette
        : currentPalette;
    const requestedMode = rawMode
      ? normalizeThemeMode(rawMode)
      : rawLegacyTheme
        ? legacyPreference.mode
        : currentMode;

    user.themePalette = requestedPalette;
    user.themeMode = requestedMode;
    await user.save();

    return NextResponse.json({
      success: true,
      themePalette: user.themePalette,
      themeMode: user.themeMode,
      user: user.toJSON(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to save theme preference', error: error.message },
      { status: 500 }
    );
  }
}
