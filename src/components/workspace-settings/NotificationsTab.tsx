import React from 'react';
import { SettingsSection, SettingsRow } from './SettingsLayout';
import { Switch } from '@/components/ui/switch';

export default function NotificationsTab({ data, updateField }: { data: any, updateField: (key: string, value: any) => void }) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notification Preferences</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Control default notification delivery methods for the workspace.</p>
      </div>

      <SettingsSection 
        title="Delivery Channels" 
        description="Select which channels are active by default. Users can override these in their own settings."
      >
        <SettingsRow 
          title="Email Notifications" 
          description="Send daily summaries and critical alerts via email."
        >
          <Switch checked={data.emailNotifications ?? true} onCheckedChange={(val) => updateField('emailNotifications', val)} />
        </SettingsRow>

        <SettingsRow 
          title="In-App Notifications" 
          description="Show a badge and popup alert while the app is open."
        >
          <Switch checked={data.inAppNotifications ?? true} onCheckedChange={(val) => updateField('inAppNotifications', val)} />
        </SettingsRow>

        <SettingsRow 
          title="Push Notifications" 
          description="Send browser/desktop push notifications."
        >
          <Switch checked={data.pushNotifications ?? false} onCheckedChange={(val) => updateField('pushNotifications', val)} />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
