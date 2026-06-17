export const THEME_PALETTES = ['midnight', 'ocean', 'forest', 'sunset', 'dawn'] as const;
export const THEME_MODES = ['dark', 'light'] as const;

export type ThemePalette = (typeof THEME_PALETTES)[number];
export type ThemeMode = (typeof THEME_MODES)[number];

export type ThemeOption = {
  id: ThemePalette;
  label: string;
  description: string;
  darkSwatches: [string, string, string];
  lightSwatches: [string, string, string];
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Classic graphite styling with warm gold and amber accents.',
    darkSwatches: ['#10131a', '#c7c9a2', '#ffb68a'],
    lightSwatches: ['#fafafe', '#5e613c', '#8c4a1c'],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Cool navy layers with cyan and sky highlights.',
    darkSwatches: ['#091522', '#72d7ff', '#8fb7ff'],
    lightSwatches: ['#f4fbff', '#0c5a78', '#2b68b8'],
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Dark evergreen panels with fresh moss contrast.',
    darkSwatches: ['#0f1712', '#9fd38f', '#f4c56a'],
    lightSwatches: ['#f6fbf5', '#355f37', '#8a640d'],
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Smoky plum surfaces with coral and amber accents.',
    darkSwatches: ['#19111c', '#ff9f7a', '#ffc36b'],
    lightSwatches: ['#fff7f6', '#9a4522', '#8f5400'],
  },
  {
    id: 'dawn',
    label: 'Dawn',
    description: 'A crisp neutral family that works well in both modes.',
    darkSwatches: ['#171a23', '#d0cc8c', '#ffbf94'],
    lightSwatches: ['#fafafe', '#5e613c', '#8c4a1c'],
  },
];

export function isThemePalette(value: string | null | undefined): value is ThemePalette {
  return !!value && THEME_PALETTES.includes(value as ThemePalette);
}

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return !!value && THEME_MODES.includes(value as ThemeMode);
}

export function normalizeThemePalette(value: string | null | undefined): ThemePalette {
  if (value === 'dark' || value === 'light') return 'midnight';
  if (isThemePalette(value)) return value;
  return 'midnight';
}

export function normalizeThemeMode(value: string | null | undefined): ThemeMode {
  if (value === 'light') return 'light';
  return 'dark';
}

export function composeThemeId(palette: ThemePalette, mode: ThemeMode) {
  return `${palette}-${mode}`;
}

export function normalizeLegacyThemePreference(value: string | null | undefined): {
  palette: ThemePalette;
  mode: ThemeMode;
} {
  if (value === 'light') {
    return { palette: 'midnight', mode: 'light' };
  }

  if (value === 'dark') {
    return { palette: 'midnight', mode: 'dark' };
  }

  if (isThemePalette(value)) {
    if (value === 'dawn') {
      return { palette: 'dawn', mode: 'light' };
    }
    return { palette: value, mode: 'dark' };
  }

  return { palette: 'midnight', mode: 'dark' };
}
