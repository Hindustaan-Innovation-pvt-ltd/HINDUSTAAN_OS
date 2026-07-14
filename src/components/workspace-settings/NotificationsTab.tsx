import React, { useState } from 'react';
import { SettingsSection, SettingsRow } from './SettingsLayout';
import { Switch } from '@/components/ui/switch';
import { Mail, Megaphone, Settings, Bell } from 'lucide-react';
import EmailLogsModule from './EmailLogsModule';
import AnnouncementCenterModule from './AnnouncementCenterModule';
import SystemNotificationsModule from './SystemNotificationsModule';

export default function NotificationsTab({ data, updateField }: { data: any, updateField: (key: string, value: any) => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'channels' | 'email-logs' | 'announcements' | 'system'>('channels');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('channels')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'channels'
              ? 'border-orange-500 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-350'
          }`}
        >
          <Settings className="h-4 w-4" />
          Delivery Channels
        </button>
        <button
          onClick={() => setActiveSubTab('email-logs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'email-logs'
              ? 'border-orange-500 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-350'
          }`}
        >
          <Mail className="h-4 w-4" />
          Email Logs
        </button>
        <button
          onClick={() => setActiveSubTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'announcements'
              ? 'border-orange-500 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-350'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          Announcement Center
        </button>
        <button
          onClick={() => setActiveSubTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'system'
              ? 'border-orange-500 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-350'
          }`}
        >
          <Bell className="h-4 w-4" />
          System Notifications
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'channels' && (
        <div className="space-y-6">
          <div>
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
      )}

      {activeSubTab === 'email-logs' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Email Logs</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View the audit history of emails sent from this workspace.</p>
          </div>
          <EmailLogsModule />
        </div>
      )}

      {activeSubTab === 'announcements' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Announcement Center</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage general broadcast announcements and pinning controls.</p>
          </div>
          <AnnouncementCenterModule />
        </div>
      )}

      {activeSubTab === 'system' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Notifications</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review system alerts, maintenance schedules, and security audits.</p>
          </div>
          <SystemNotificationsModule />
        </div>
      )}

    </div>
  );
}
