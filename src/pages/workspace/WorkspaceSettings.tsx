import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Settings, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useTheme } from '@/context/ThemeContext';
import GeneralTab from '@/components/workspace-settings/GeneralTab';
import ProjectsTab from '@/components/workspace-settings/ProjectsTab';
import AppearanceTab from '@/components/workspace-settings/AppearanceTab';

export default function WorkspaceSettings({ onNavigate, currentView }: { onNavigate?: (view: string) => void, currentView?: string }) {
  const activeTab = currentView ? currentView.split(' - ')[1]?.toLowerCase() : 'general';
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
      case 'appearance': return <AppearanceTab data={formData} updateField={updateField} />;
      default: return <GeneralTab data={formData} updateField={updateField} />;
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-page-title text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-indigo-500" />
            Workspace Settings
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 max-w-3xl">
            Manage workspace configuration and organizational preferences.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 mt-2 sm:mt-0">
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

      {/* Main Layout Content */}
      <div className="max-w-4xl pt-4">
        {renderTabContent()}
      </div>
    </div>
  );
}
