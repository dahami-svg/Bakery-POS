'use client';

import { useState } from 'react';
import { Check, MonitorCog, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { THEME_OPTIONS } from '@/lib/themes';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { themePalette, themeMode, setThemePalette } = useTheme();
  const activeTheme = THEME_OPTIONS.find((option) => option.id === themePalette);
  const [savingTheme, setSavingTheme] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleThemeSelect = async (nextTheme: (typeof THEME_OPTIONS)[number]['id']) => {
    if (nextTheme === themePalette) return;

    setSavingTheme(nextTheme);
    setFeedback(null);

    try {
      await setThemePalette(nextTheme);
      setFeedback('Theme family saved to your account.');
    } catch {
      setFeedback('Theme family applied locally, but saving to your account failed.');
    } finally {
      setSavingTheme(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="mx-auto flex w-full flex-col gap-6 p-4 lg:p-8">
        <section>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-black tracking-tight text-on-surface lg:text-2xl">
                Customize your dashboard colors
              </h1>
            </div>

            {/* <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                Active Theme
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex gap-2">
                  {(themeMode === 'dark' ? activeTheme?.darkSwatches : activeTheme?.lightSwatches)?.map((swatch) => (
                    <span
                      key={swatch}
                      className="size-4 rounded-full border border-white/10 shadow-sm"
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{activeTheme?.label}</p>
                  <p className="text-xs text-on-surface-variant">
                    {themeMode === 'dark' ? 'Dark mode' : 'Light mode'} active
                  </p>
                </div>
              </div>
              {feedback && (
                <p className="mt-3 text-xs font-medium text-on-surface-variant">{feedback}</p>
              )}
            </div> */}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {THEME_OPTIONS.map((option) => {
            const isActive = option.id === themePalette;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => void handleThemeSelect(option.id)}
                disabled={savingTheme === option.id}
                className={cn(
                  'group rounded-[26px] border p-4 text-left transition-all disabled:cursor-wait disabled:opacity-80',
                  isActive
                    ? 'border-primary bg-surface-container-high shadow-[0_0_0_1px_var(--primary)]'
                    : 'border-outline-variant bg-surface-container hover:border-outline hover:bg-surface-container-high/80'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                    <Palette size={12} />
                    {option.label}
                  </div>
                  <span
                    className={cn(
                      'inline-flex size-7 items-center justify-center rounded-full border transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant bg-surface text-transparent group-hover:text-on-surface-variant'
                    )}
                  >
                    <Check size={14} className={savingTheme === option.id ? 'animate-pulse' : ''} />
                  </span>
                </div>

                <div className="mt-5 rounded-[22px] border border-white/5 bg-surface p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                        <Moon size={11} />
                        Dark
                      </div>
                      <div className="flex gap-2">
                        {option.darkSwatches.map((swatch) => (
                          <span
                            key={swatch}
                            className="h-9 flex-1 rounded-2xl border border-black/10"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                        <Sun size={11} />
                        Light
                      </div>
                      <div className="flex gap-2">
                        {option.lightSwatches.map((swatch) => (
                          <span
                            key={swatch}
                            className="h-9 flex-1 rounded-2xl border border-black/10"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
}
