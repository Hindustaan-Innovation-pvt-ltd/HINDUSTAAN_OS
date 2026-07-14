import React, { createContext, useContext, useEffect, useState } from 'react';

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
}

interface WorkspaceContextType {
  config: WorkspaceConfig;
  updateConfig: (newConfig: Partial<WorkspaceConfig>) => void;
}

const DEFAULT_CONFIG: WorkspaceConfig = {
  workspaceName: 'Hindustaan OS',
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
  themeMode: 'system',
  accentColor: 'blue',
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WorkspaceConfig>(() => {
    try {
      const saved = localStorage.getItem('workspace_config_v2');
      const legacy = localStorage.getItem('workspace_auth_config');
      const parsed = saved ? JSON.parse(saved) : (legacy ? JSON.parse(legacy) : {});
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch (e) {
      console.error('Failed to parse workspace config:', e);
      return DEFAULT_CONFIG;
    }
  });

  const updateConfig = (newConfig: Partial<WorkspaceConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('workspace_config_v2', JSON.stringify(updated));
      return updated;
    });
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
