import React from 'react';
import { SettingsSection, SettingsRow } from './SettingsLayout';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function SecurityTab({ data, updateField }: { data: any, updateField: (key: string, value: any) => void }) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Security & Access</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage authentication, user policies, and network restrictions.</p>
      </div>

      <SettingsSection 
        title="Authentication Policies" 
        description="Configure how users access the workspace."
      >
        <SettingsRow 
          title="Single Sign-On (SSO)" 
          description="Allow users to log in with SAML/Enterprise providers."
        >
          <Switch checked={data.ssoEnabled ?? true} onCheckedChange={(val) => updateField('ssoEnabled', val)} />
        </SettingsRow>
        
        <SettingsRow 
          title="Require Two-Factor Authentication" 
          description="Enforce 2FA for all members in the workspace."
        >
          <Switch checked={data.twoFactorEnforced ?? true} onCheckedChange={(val) => updateField('twoFactorEnforced', val)} />
        </SettingsRow>

        <SettingsRow 
          title="Session Timeout" 
          description="Automatically log out inactive users after 24 hours."
        >
          <Switch checked={data.sessionTimeout ?? true} onCheckedChange={(val) => updateField('sessionTimeout', val)} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection 
        title="Access Controls" 
        description="Restrict onboarding and IP access."
      >
        <SettingsRow 
          title="Public Signups" 
          description="Allow anyone with a matching email domain to join automatically."
        >
          <Switch checked={data.publicSignups ?? false} onCheckedChange={(val) => updateField('publicSignups', val)} />
        </SettingsRow>

        <SettingsRow 
          title="Auto Provisioning" 
          description="Automatically create accounts for invited users via API."
        >
          <Switch checked={data.autoProvisioning ?? false} onCheckedChange={(val) => updateField('autoProvisioning', val)} />
        </SettingsRow>

        <SettingsRow 
          title="Password Policy" 
        >
          <Select 
            value={data.passwordPolicy || 'Strong'} 
            onValueChange={(val) => updateField('passwordPolicy', val)}
          >
            <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 w-full sm:w-64">
              <SelectValue placeholder="Select Policy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard (8+ chars)</SelectItem>
              <SelectItem value="Strong">Strong (12+ chars, special)</SelectItem>
              <SelectItem value="Strict">Strict (16+ chars, rotation)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow 
          title="IP Restrictions (Allowed CIDRs)" 
          description="Limit access to specific networks. Leave blank to allow access from anywhere."
          vertical={true}
        >
          <Input 
            value={data.ipRestrictions || ''} 
            onChange={(e) => updateField('ipRestrictions', e.target.value)} 
            className="rounded-xl font-mono text-sm bg-slate-50 dark:bg-slate-900/50"
            placeholder="e.g. 192.168.1.0/24, 10.0.0.0/8"
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
