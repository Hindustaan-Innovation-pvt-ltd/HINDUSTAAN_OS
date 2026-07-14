import React, { useState } from 'react';
import { SettingsSection, SettingsRow } from './SettingsLayout';
import { Switch } from '@/components/ui/switch';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DeliveryChannelsModule() {
  const { config, updateConfig } = useWorkspace();
  const [formData, setFormData] = useState(config);
  
  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(config);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateConfig(formData);
      setIsSaving(false);
      toast.success('Delivery channel preferences saved successfully');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notification Preferences</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Control default notification delivery methods for the workspace.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasUnsavedChanges || isSaving}
          className={`shrink-0 rounded-xl font-bold transition-all ${
            hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
          }`}
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>

      <SettingsSection 
        title="Delivery Channels" 
        description="Select which channels are active by default. Users can override these in their own settings."
      >
        <SettingsRow 
          title="Email Notifications" 
          description="Send daily summaries and critical alerts via email."
        >
          <Switch checked={formData.emailNotifications ?? true} onCheckedChange={(val) => updateField('emailNotifications', val)} />
        </SettingsRow>

        <SettingsRow 
          title="In-App Notifications" 
          description="Show a badge and popup alert while the app is open."
        >
          <Switch checked={formData.inAppNotifications ?? true} onCheckedChange={(val) => updateField('inAppNotifications', val)} />
        </SettingsRow>

        <SettingsRow 
          title="Push Notifications" 
          description="Send browser/desktop push notifications."
        >
          <Switch checked={formData.pushNotifications ?? false} onCheckedChange={(val) => updateField('pushNotifications', val)} />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
