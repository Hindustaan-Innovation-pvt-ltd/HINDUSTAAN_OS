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
          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Upload</span>
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
