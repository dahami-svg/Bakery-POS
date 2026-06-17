'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  composeThemeId,
  normalizeLegacyThemePreference,
  normalizeThemeMode,
  normalizeThemePalette,
  THEME_OPTIONS,
  type ThemeMode,
  type ThemeOption,
  type ThemePalette,
} from '@/lib/themes';

interface ThemeContextType {
  theme: string;
  themePalette: ThemePalette;
  themeMode: ThemeMode;
  setThemePalette: (palette: ThemePalette) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  themeOptions: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_PALETTE_STORAGE_KEY = 'theme-palette';
const THEME_MODE_STORAGE_KEY = 'theme-mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [themePalette, setThemePaletteState] = useState<ThemePalette>('midnight');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedPalette = localStorage.getItem(THEME_PALETTE_STORAGE_KEY);
    const storedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    const legacyTheme = localStorage.getItem('theme');
    const legacyPreference = normalizeLegacyThemePreference(legacyTheme);

    setThemePaletteState(
      storedPalette ? normalizeThemePalette(storedPalette) : legacyPreference.palette
    );
    setThemeModeState(
      storedMode ? normalizeThemeMode(storedMode) : legacyPreference.mode
    );
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) return;

    if (user.themePalette || user.themeMode) {
      const nextPalette = normalizeThemePalette(user.themePalette);
      const nextMode = normalizeThemeMode(user.themeMode);
      setThemePaletteState((current) => (current === nextPalette ? current : nextPalette));
      setThemeModeState((current) => (current === nextMode ? current : nextMode));
      return;
    }

    if (user.theme) {
      const legacyPreference = normalizeLegacyThemePreference(user.theme);
      setThemePaletteState((current) => (
        current === legacyPreference.palette ? current : legacyPreference.palette
      ));
      setThemeModeState((current) => (
        current === legacyPreference.mode ? current : legacyPreference.mode
      ));
    }
  }, [mounted, user]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.dataset.theme = composeThemeId(themePalette, themeMode);
    root.classList.remove('light');
    localStorage.setItem(THEME_PALETTE_STORAGE_KEY, themePalette);
    localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
    localStorage.setItem('theme', themeMode === 'light' ? 'light' : themePalette);
  }, [themePalette, themeMode, mounted]);

  const persistTheme = async (nextPalette: ThemePalette, nextMode: ThemeMode) => {
    setThemePaletteState(nextPalette);
    setThemeModeState(nextMode);
    localStorage.setItem(THEME_PALETTE_STORAGE_KEY, nextPalette);
    localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
    localStorage.setItem('theme', nextMode === 'light' ? 'light' : nextPalette);

    if (!user?._id) {
      return;
    }

    const response = await fetch('/api/auth/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themePalette: nextPalette, themeMode: nextMode }),
    });

    if (!response.ok) {
      throw new Error('Failed to save theme preference');
    }
  };

  const setThemePalette = async (nextPalette: ThemePalette) => {
    await persistTheme(nextPalette, themeMode);
  };

  const setThemeMode = async (nextMode: ThemeMode) => {
    await persistTheme(themePalette, nextMode);
  };

  const toggleTheme = async () => {
    await persistTheme(themePalette, themeMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: composeThemeId(themePalette, themeMode),
        themePalette,
        themeMode,
        setThemePalette,
        setThemeMode,
        toggleTheme,
        themeOptions: THEME_OPTIONS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
