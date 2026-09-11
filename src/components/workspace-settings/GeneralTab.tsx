import React from 'react';
import { SettingsSection, SettingsRow } from './SettingsLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from 'sonner';
import { ChevronUp, ChevronDown } from 'lucide-react';

const PRESET_HOURS = [8, 9, 10, 11, 12, 13, 14];

export default function GeneralTab({ data, updateField }: { data: any, updateField: (key: string, value: any) => void }) {
  const { updateConfig } = useWorkspace();

  const currentHours = data.maxWorkingHours !== undefined && data.maxWorkingHours !== null ? Number(data.maxWorkingHours) : 9;
  const isPreset = PRESET_HOURS.includes(currentHours);

  const [isCustomMode, setIsCustomMode] = React.useState<boolean>(!isPreset);
  const [customVal, setCustomVal] = React.useState<string>(String(currentHours));

  React.useEffect(() => {
    if (data.maxWorkingHours !== undefined && data.maxWorkingHours !== null) {
      const val = Number(data.maxWorkingHours);
      if (!PRESET_HOURS.includes(val)) {
        setIsCustomMode(true);
      }
      setCustomVal(String(val));
    }
  }, [data.maxWorkingHours]);

  const handleSelectChange = (val: string) => {
    if (val === 'custom') {
      setIsCustomMode(true);
      return;
    }
    setIsCustomMode(false);
    const numVal = parseInt(val, 10);
    setCustomVal(String(numVal));
    updateField('maxWorkingHours', numVal);
    updateConfig({ maxWorkingHours: numVal });
    toast.success(`Attendance limit updated to ${numVal} Hours (Saved to DB)`);
  };

  const handleApplyCustomHours = () => {
    const numVal = parseInt(customVal, 10);
    if (isNaN(numVal) || numVal < 1 || numVal > 24) {
      toast.error('Please enter a valid working hour limit between 1 and 24 hours');
      return;
    }
    updateField('maxWorkingHours', numVal);
    updateConfig({ maxWorkingHours: numVal });
    toast.success(`Attendance limit updated to ${numVal} Hours (Saved to DB)`);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Organization Details</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your workspace's basic information and localization.</p>
      </div>

      <SettingsSection 
        title="Workspace Profile" 
        description="This information will be visible to all members."
      >
        <SettingsRow 
          title="Workspace Logo" 
          description="A square image works best. Recommended size is 256x256px."
        >
          <div className="relative group">
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="Upload Logo"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      updateField('workspaceLogo', event.target.result.toString());
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors overflow-hidden">
              {data.workspaceLogo ? (
                <img src={data.workspaceLogo} alt="Workspace Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-slate-500 uppercase">Upload</span>
              )}
            </div>
            {data.workspaceLogo && (
              <button 
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm"
                onClick={(e) => {
                  e.preventDefault();
                  updateField('workspaceLogo', '');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        </SettingsRow>
        
        <SettingsRow title="Organization Name" description="The official name of your company or organization.">
          <Input 
            value={data.companyName || ''} 
            onChange={(e) => updateField('companyName', e.target.value)} 
            placeholder="Acme Corp" 
            className="rounded-xl bg-slate-50 dark:bg-slate-900/50 w-full sm:w-80"
          />
        </SettingsRow>
        
        <SettingsRow title="Support Email" description="Used by employees and systems for support notifications.">
          <Input 
            type="email"
            value={data.supportEmail || ''} 
            onChange={(e) => updateField('supportEmail', e.target.value)} 
            placeholder="support@acme.com" 
            className="rounded-xl bg-slate-50 dark:bg-slate-900/50 w-full sm:w-80"
          />
        </SettingsRow>

        <SettingsRow title="Office Address" description="Primary physical location or registered office address.">
          <Input 
            value={data.address || ''} 
            onChange={(e) => updateField('address', e.target.value)} 
            placeholder="123 Innovation Drive, Tech Park" 
            className="rounded-xl bg-slate-50 dark:bg-slate-900/50 w-full sm:w-80"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection 
        title="Regional & Localization" 
        description="Configure default timezone, currency, and date formats."
      >
        <SettingsRow title="Default Timezone" description="Affects timestamps across all automated logs and check-ins.">
          <Select 
            value={data.defaultTimezone || 'Asia/Kolkata'} 
            onValueChange={(val) => updateField('defaultTimezone', val)}
          >
            <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 w-full sm:w-64">
              <SelectValue placeholder="Select Timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
              <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
              <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
              <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
              <SelectItem value="UTC">UTC (Universal)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        
        <SettingsRow title="Default Currency" description="Used for financial reporting and organizational billing.">
          <Select 
            value={data.currency || 'INR'} 
            onValueChange={(val) => updateField('currency', val)}
          >
            <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 w-full sm:w-64">
              <SelectValue placeholder="Select Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
              <SelectItem value="USD">US Dollar ($)</SelectItem>
              <SelectItem value="EUR">Euro (€)</SelectItem>
              <SelectItem value="GBP">British Pound (£)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection 
        title="Attendance Policy & Work Rules" 
        description="Configure rules for attendance sessions and daily work hours validation across the workspace."
      >
        <SettingsRow 
          title="Maximum Working Hours" 
          description="If an employee forgets to check out and this duration is exceeded, their attendance session becomes INVALID (MISSED_CHECKOUT) with 0 worked time. They must perform a fresh check-in."
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <Select 
              value={isCustomMode ? 'custom' : String(currentHours)} 
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/80 w-full sm:w-64 font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xs">
                <SelectValue placeholder="Select Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 Hours</SelectItem>
                <SelectItem value="9">9 Hours (Default)</SelectItem>
                <SelectItem value="10">10 Hours</SelectItem>
                <SelectItem value="11">11 Hours</SelectItem>
                <SelectItem value="12">12 Hours</SelectItem>
                <SelectItem value="13">13 Hours</SelectItem>
                <SelectItem value="14">14 Hours</SelectItem>
                <SelectItem value="custom" className="font-semibold text-slate-900 dark:text-white">
                  Custom Hours...
                </SelectItem>
              </SelectContent>
            </Select>

            {isCustomMode && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="relative flex items-center bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 h-10 px-2.5 gap-1 focus-within:ring-2 focus-within:ring-violet-500/50 focus-within:border-violet-500 transition-all shadow-xs">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={customVal}
                    onChange={(e) => setCustomVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyCustomHours();
                    }}
                    placeholder="8"
                    className="w-8 bg-transparent font-bold text-center text-slate-900 dark:text-white text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  
                  {/* Sleek Custom Increasing & Decreasing Stepper Buttons */}
                  <div className="flex flex-col border-l border-slate-200 dark:border-slate-800 pl-1.5 py-0.5 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(customVal, 10) || 1;
                        setCustomVal(String(Math.min(24, current + 1)));
                      }}
                      className="h-3.5 w-4 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
                      title="Increase hours"
                    >
                      <ChevronUp className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(customVal, 10) || 1;
                        setCustomVal(String(Math.max(1, current - 1)));
                      }}
                      className="h-3.5 w-4 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
                      title="Decrease hours"
                    >
                      <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  <span className="text-xs font-bold text-slate-400 pointer-events-none select-none pl-1 pr-0.5">hrs</span>
                </div>

                <button
                  type="button"
                  onClick={handleApplyCustomHours}
                  className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm shadow-violet-600/30 cursor-pointer"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
