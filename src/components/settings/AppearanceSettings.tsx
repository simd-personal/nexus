'use client';

import { Moon, Sun, ThermometerSun } from 'lucide-react';
import { useThemePreferences } from '@/hooks/useThemePreferences';
import { cn } from '@/lib/utils';

function SettingToggle({
  id,
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-[var(--ud-cloud)] dark:text-gray-200">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <label htmlFor={id} className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </label>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-1 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-[var(--ud-mist)]',
          checked ? 'bg-gray-900 dark:bg-amber-500' : 'bg-gray-200 dark:bg-[var(--ud-cloud)]'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

export function AppearanceSettings() {
  const { darkMode, warmthOn, setTheme, setWarmth } = useThemePreferences();

  return (
    <div className="space-y-6">
      <SettingToggle
        id="dark-mode-toggle"
        label="Dark mode"
        description="Use a darker interface across the app. Saved on this device."
        checked={darkMode}
        onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        icon={darkMode ? Moon : Sun}
      />
      <SettingToggle
        id="warmth-toggle"
        label="Blue light warmth"
        description="Adds a warm tint to reduce harsh blue light, especially at night."
        checked={warmthOn}
        onChange={(checked) => setWarmth(checked ? 'on' : 'off')}
        icon={ThermometerSun}
      />
    </div>
  );
}
