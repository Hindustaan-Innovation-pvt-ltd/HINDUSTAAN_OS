import React from 'react';
import { SettingsSection, SettingsRow } from './SettingsLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GeneralTab({ data, updateField }: { data: any, updateField: (key: string, value: any) => void }) {
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
        
        <SettingsRow 
          title="Company Name" 
          description="The official name of your organization."
        >
          <Input 
            value={data.workspaceName || ''} 
            onChange={(e) => updateField('workspaceName', e.target.value)} 
            className="rounded-xl bg-slate-50 dark:bg-slate-900/50"
            placeholder="e.g. Hindustaan Innovations"
          />
        </SettingsRow>
        
        <SettingsRow 
          title="Support Email" 
          description="Where users should send internal support queries."
        >
          <Input 
            type="email"
            value={data.supportEmail || ''} 
            onChange={(e) => updateField('supportEmail', e.target.value)} 
            className="rounded-xl bg-slate-50 dark:bg-slate-900/50"
            placeholder="support@company.com"
          />
        </SettingsRow>

        <SettingsRow 
          title="Headquarters Address" 
          description="The primary physical location of your workspace."
        >
          <Input 
            value={data.address || ''} 
            onChange={(e) => updateField('address', e.target.value)} 
            className="rounded-xl bg-slate-50 dark:bg-slate-900/50"
            placeholder="123 Innovation Drive, Tech City"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection 
        title="Localization" 
        description="Set regional defaults for all users."
      >
        <SettingsRow title="Default Timezone" description="Affects all date and time displays for new users.">
          <Select 
            value={data.defaultTimezone || 'Asia/Kolkata'} 
            onValueChange={(val) => updateField('defaultTimezone', val)}
          >
            <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 w-full sm:w-64">
              <SelectValue placeholder="Select Timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
              <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
              <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        
        <SettingsRow title="Default Currency" description="Used for financial reporting and budget tracking.">
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
    </div>
  );
}
