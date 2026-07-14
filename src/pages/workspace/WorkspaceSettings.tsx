import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Settings, ArrowLeft, Sliders, FolderKanban, Shield, Bell, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useTheme } from '@/context/ThemeContext';
import GeneralTab from '@/components/workspace-settings/GeneralTab';
import ProjectsTab from '@/components/workspace-settings/ProjectsTab';
import SecurityTab from '@/components/workspace-settings/SecurityTab';
import NotificationsTab from '@/components/workspace-settings/NotificationsTab';
import AppearanceTab from '@/components/workspace-settings/AppearanceTab';

const TABS = [
  { id: 'general', name: 'General', icon: Sliders },
  { id: 'projects', name: 'Projects', icon: FolderKanban },
  { id: 'security', name: 'Security & Access', icon: Shield },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'appearance', name: 'Appearance', icon: Palette },
];

export default function WorkspaceSettings({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
  const { config, updateConfig } = useWorkspace();
  const { setThemeMode, setAccentColor } = useTheme();
  const [formData, setFormData] = useState(config);

  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(config);

  React.useEffect(() => {
    // Only update if no unsaved changes to prevent overwriting user input
    if (JSON.stringify(formData) === JSON.stringify(config)) {
      setFormData(config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const updateField = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      updateConfig(formData);
      
      // Apply theme changes globally if they were modified
      if (formData.themeMode) {
        setThemeMode(formData.themeMode as any);
      }
      if (formData.accentColor) {
        setAccentColor(formData.accentColor as any);
      }
      
      toast.success('Workspace settings saved successfully');
    }, 1000);
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return <GeneralTab data={formData} updateField={updateField} />;
      case 'projects': return <ProjectsTab data={formData} updateField={updateField} />;
      case 'security': return <SecurityTab data={formData} updateField={updateField} />;
      case 'notifications': return <NotificationsTab data={formData} updateField={updateField} />;
      case 'appearance': return <AppearanceTab data={formData} updateField={updateField} />;
      default: return <GeneralTab data={formData} updateField={updateField} />;
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-[#0c1222] flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0c1222]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onNavigate && (
            <Button variant="ghost" size="icon" onClick={() => onNavigate('Dashboard')} className="rounded-full shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Button>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-500" /> Workspace Settings
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-500 hidden sm:inline-block bg-amber-100 dark:bg-amber-500/10 px-2 py-1 rounded-md">Unsaved changes</span>
          )}
          {hasUnsavedChanges && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFormData(config)}
              disabled={isSaving}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Discard
            </Button>
          )}
          <Button 
            size="sm"
            onClick={handleSave} 
            disabled={isSaving || !hasUnsavedChanges}
            className={cn(
              "rounded-lg font-semibold px-4 transition-all",
              hasUnsavedChanges ? "bg-[#5B7CFF] hover:bg-[#5B7CFF]/90 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            )}
          >
            {isSaving ? 'Saving...' : 'Update Settings'}
          </Button>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto">
        
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/30 dark:bg-[#0c1222] p-4 md:py-8 space-y-6">
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-3">Configuration</h4>
            <nav className="space-y-0.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all text-left",
                      isActive 
                        ? "bg-slate-200/50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-300"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-slate-900 dark:text-white" : "text-slate-400")} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 max-w-4xl p-6 md:p-10 lg:p-12">
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
}
