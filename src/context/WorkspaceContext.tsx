import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

export interface WorkspaceConfig {
  workspaceName: string;
  workspaceLogo?: string;
  defaultTimezone: string;
  language: string;
  supportEmail: string;
  address: string;
  currency: string;
  defaultProjectStatus: string;
  defaultTaskStatus: string;
  defaultPriority: string;
  ssoEnabled: boolean;
  twoFactorEnforced: boolean;
  publicSignups: boolean;
  autoProvisioning: boolean;
  sessionTimeout: boolean;
  passwordPolicy: string;
  ipRestrictions: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  pushNotifications: boolean;
  themeMode: string;
  accentColor: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  whatsappWebhook?: string;
  maxWorkingHours: number;
}

interface WorkspaceContextType {
  config: WorkspaceConfig;
  updateConfig: (newConfig: Partial<WorkspaceConfig>) => void;
}

const DEFAULT_CONFIG: WorkspaceConfig = {
  workspaceName: 'Project OS',
  workspaceLogo: '',
  defaultTimezone: 'Asia/Kolkata',
  language: 'English',
  supportEmail: 'support@hindustaan.in',
  address: 'Raipur, Chhattisgarh, India',
  currency: 'INR',
  defaultProjectStatus: 'Planning',
  defaultTaskStatus: 'To Do',
  defaultPriority: 'Medium',
  ssoEnabled: true,
  twoFactorEnforced: true,
  publicSignups: false,
  autoProvisioning: true,
  sessionTimeout: true,
  passwordPolicy: 'Strong',
  ipRestrictions: '',
  emailNotifications: true,
  inAppNotifications: true,
  pushNotifications: false,
  themeMode: 'dark',
  accentColor: 'blue',
  maxWorkingHours: 9,
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WorkspaceConfig>(() => {
    try {
      const saved = localStorage.getItem('workspace_config_v2');
      const legacy = localStorage.getItem('workspace_auth_config');
      const parsed = saved ? JSON.parse(saved) : (legacy ? JSON.parse(legacy) : {});
      const merged = { ...DEFAULT_CONFIG, ...parsed };
      if (merged.workspaceName === 'Hindustaan OS') {
        merged.workspaceName = 'Project OS';
      }
      if (merged.themeMode === 'system') {
        merged.themeMode = 'dark';
      }
      return merged;
    } catch (e) {
      console.error('Failed to parse workspace config:', e);
      return DEFAULT_CONFIG;
    }
  });

  const fetchWorkspaceSettings = async () => {
    try {
      const res = await api.get('/settings/workspace');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setConfig(prev => ({
          ...prev,
          workspaceName: d.companyName || prev.workspaceName,
          supportEmail: d.supportEmail || prev.supportEmail,
          themeMode: d.primaryTheme || prev.themeMode,
          workspaceLogo: d.workspaceLogo !== undefined && d.workspaceLogo !== null ? d.workspaceLogo : prev.workspaceLogo,
          address: d.address || prev.address,
          defaultTimezone: d.defaultTimezone || prev.defaultTimezone,
          currency: d.currency || prev.currency,
          smtpHost: d.smtpHost || '',
          smtpPort: d.smtpPort || undefined,
          smtpUser: d.smtpUser || '',
          smtpPass: d.smtpPass || '',
          whatsappWebhook: d.whatsappWebhook || '',
          maxWorkingHours: d.maxWorkingHours !== undefined && d.maxWorkingHours !== null ? d.maxWorkingHours : prev.maxWorkingHours,
        }));
      }
    } catch (e) {
      console.error("Failed to load workspace settings from backend:", e);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
    if (userStr) {
      fetchWorkspaceSettings();
    }
  }, []);

  const updateConfig = async (newConfig: Partial<WorkspaceConfig>) => {
    const mergedConfig: WorkspaceConfig = { ...config, ...newConfig };
    setConfig(mergedConfig);
    localStorage.setItem('workspace_config_v2', JSON.stringify(mergedConfig));

    try {
      if ('workspaceName' in newConfig || 'supportEmail' in newConfig || 'themeMode' in newConfig || 'workspaceLogo' in newConfig || 'address' in newConfig || 'defaultTimezone' in newConfig || 'currency' in newConfig || 'maxWorkingHours' in newConfig) {
        await api.put('/settings/workspace', {
          companyName: mergedConfig.workspaceName,
          supportEmail: mergedConfig.supportEmail,
          primaryTheme: mergedConfig.themeMode,
          workspaceLogo: mergedConfig.workspaceLogo || "",
          address: mergedConfig.address || "",
          defaultTimezone: mergedConfig.defaultTimezone || "Asia/Kolkata",
          currency: mergedConfig.currency || "INR",
          maxWorkingHours: mergedConfig.maxWorkingHours || 9,
        });
      }
      const hasChannels = 'smtpHost' in newConfig || 'smtpPort' in newConfig || 'smtpUser' in newConfig || 'smtpPass' in newConfig || 'whatsappWebhook' in newConfig;
      if (hasChannels) {
        await api.put('/settings/workspace/channels', {
          smtpHost: newConfig.smtpHost || null,
          smtpPort: newConfig.smtpPort ? parseInt(newConfig.smtpPort as any, 10) : null,
          smtpUser: newConfig.smtpUser || null,
          smtpPass: newConfig.smtpPass || null,
          whatsappWebhook: newConfig.whatsappWebhook || null
        });
      }
    } catch (e) {
      console.error("Failed to save workspace settings to backend:", e);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ config, updateConfig }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
