import React from 'react';
import { SettingsSection, SettingsRow } from './SettingsLayout';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

const ACCENT_COLORS = [
  { id: 'orange', hex: '#F97316' },
  { id: 'blue', hex: '#3B82F6' },
  { id: 'emerald', hex: '#10B981' },
  { id: 'rose', hex: '#F43F5E' },
  { id: 'purple', hex: '#A855F7' }
];

export default function AppearanceTab({ data, updateField }: { data: any, updateField: (key: string, value: any) => void }) {
  const { themeMode, setThemeMode, setAccentColor } = useTheme();

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Appearance & Branding</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize how the workspace looks and feels.</p>
      </div>

      <SettingsSection 
        title="Theme Preferences" 
        description="Select a default theme or follow the system preference."
      >
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="cursor-pointer block group">
                <input 
                  type="radio" 
                  name="themeMode" 
                  value="light" 
                  checked={data.themeMode === 'light'}
                  onChange={() => {
                    updateField('themeMode', 'light');
                  }}
                  className="sr-only peer" 
                />
                <div className="rounded-xl border-2 border-slate-200 dark:border-slate-800 peer-checked:border-[#5B7CFF] peer-checked:ring-4 peer-checked:ring-[#5B7CFF]/10 overflow-hidden transition-all bg-white">
                  <div className="h-32 bg-slate-50 flex flex-col p-3 space-y-3 group-hover:bg-slate-100 transition-colors">
                    <div className="h-4 bg-white rounded shadow-sm w-1/3" />
                    <div className="flex-1 bg-white rounded shadow-sm p-3 space-y-2 border border-slate-100">
                      <div className="h-2 bg-slate-200 rounded w-full" />
                      <div className="h-2 bg-slate-200 rounded w-4/5" />
                      <div className="h-2 bg-slate-200 rounded w-3/4" />
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Light Mode</div>
              </label>
            </div>
            
            <div>
              <label className="cursor-pointer block group">
                <input 
                  type="radio" 
                  name="themeMode" 
                  value="dark"
                  checked={data.themeMode === 'dark'}
                  onChange={() => {
                    updateField('themeMode', 'dark');
                  }}
                  className="sr-only peer" 
                />
                <div className="rounded-xl border-2 border-slate-200 dark:border-slate-800 peer-checked:border-[#5B7CFF] peer-checked:ring-4 peer-checked:ring-[#5B7CFF]/10 overflow-hidden transition-all bg-[#0c1222]">
                  <div className="h-32 bg-[#0c1222] flex flex-col p-3 space-y-3 group-hover:bg-slate-900 transition-colors">
                    <div className="h-4 bg-slate-800 rounded shadow-sm border border-slate-800/50 w-1/3" />
                    <div className="flex-1 bg-slate-900 rounded shadow-sm border border-slate-800/50 p-3 space-y-2">
                      <div className="h-2 bg-slate-800 rounded w-full" />
                      <div className="h-2 bg-slate-800 rounded w-4/5" />
                      <div className="h-2 bg-slate-800 rounded w-3/4" />
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Dark Mode</div>
              </label>
            </div>

            <div>
              <label className="cursor-pointer block group">
                <input 
                  type="radio" 
                  name="themeMode" 
                  value="system"
                  checked={data.themeMode === 'system'}
                  onChange={() => {
                    updateField('themeMode', 'system');
                  }}
                  className="sr-only peer" 
                />
                <div className="rounded-xl border-2 border-slate-200 dark:border-slate-800 peer-checked:border-[#5B7CFF] peer-checked:ring-4 peer-checked:ring-[#5B7CFF]/10 overflow-hidden transition-all relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-[#0c1222] pointer-events-none" />
                  <div className="h-32 flex flex-col p-3 space-y-3 relative z-10">
                    <div className="flex gap-2">
                      <div className="h-4 bg-white rounded shadow-sm w-full" />
                      <div className="h-4 bg-slate-800 rounded shadow-sm border border-slate-800/50 w-full" />
                    </div>
                    <div className="flex-1 flex gap-2">
                      <div className="h-full w-full bg-white rounded shadow-sm p-3 space-y-2 border border-slate-100">
                        <div className="h-2 bg-slate-200 rounded w-full" />
                        <div className="h-2 bg-slate-200 rounded w-4/5" />
                      </div>
                      <div className="h-full w-full bg-slate-900 rounded shadow-sm border border-slate-800/50 p-3 space-y-2">
                        <div className="h-2 bg-slate-800 rounded w-full" />
                        <div className="h-2 bg-slate-800 rounded w-4/5" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">System</div>
              </label>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection 
        title="Accent Color" 
        description="Choose a brand color for primary buttons and active states."
      >
        <div className="p-6">
          <div className="flex flex-wrap gap-4">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                className={cn(
                  "w-12 h-12 rounded-full transition-all hover:scale-110 shadow-sm flex items-center justify-center border-4",
                  data.accentColor === color.id ? "border-slate-300 dark:border-slate-600 scale-110 ring-4 ring-slate-100 dark:ring-slate-800" : "border-transparent"
                )}
                style={{ backgroundColor: color.hex }}
                onClick={() => {
                  updateField('accentColor', color.id);
                }}
                aria-label={`Select accent color ${color.id}`}
              >
                {data.accentColor === color.id && (
                  <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
