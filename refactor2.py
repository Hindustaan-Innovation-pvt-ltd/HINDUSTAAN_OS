import re

def refactor():
    with open('src/components/layout/DashboardShell.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add Sheet imports
    content = content.replace(
        'import { Badge } from "@/components/ui/badge";',
        'import { Badge } from "@/components/ui/badge";\nimport { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";'
    )
    
    # 2. Extract Sidebar Content
    start_marker = '        {/* Branding Badge */}'
    end_marker = '      </div>\n\n      {/* Main Context Body */}'
    
    sidebar_html = content.split(start_marker)[1].split(end_marker)[0]
    
    sidebar_component = f'''
const SidebarContent = ({{ isDark, currentView, role, onNavigate, setSidebarOpen, activeNavigation, onSignOut }}: any) => (
    <div className="flex h-full flex-col">
        {{/* Branding Badge */}}
{sidebar_html}
    </div>
);
'''
    
    # Insert SidebarContent before DashboardShell definition
    content = content.replace(
        'export default function DashboardShell',
        sidebar_component + '\nexport default function DashboardShell'
    )
    
    # 3. Replace the layout block
    layout_start = '  return (\n    <div className="flex h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950 transition-colors duration-500">'
    layout_end = '<div className="flex flex-1 items-center justify-between gap-x-4 self-stretch lg:gap-x-6">'
    
    old_layout_block = content.split(layout_start)[1].split(layout_end)[0]
    
    new_layout_block = '''
      {/* Left Desktop Sidebar */}
      <div className="hidden lg:flex inset-y-0 left-0 z-50 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60 lg:w-[260px] shrink-0">
        <SidebarContent isDark={isDark} currentView={currentView} role={role} onNavigate={onNavigate} setSidebarOpen={setSidebarOpen} activeNavigation={activeNavigation} onSignOut={onSignOut} />
      </div>

      {/* Main Context Body */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0 w-full max-w-full">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
          
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="-m-2.5 p-2.5 text-slate-700 dark:text-slate-200 lg:hidden"
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[260px] border-r border-slate-200 dark:border-slate-700/60">
              <SidebarContent isDark={isDark} currentView={currentView} role={role} onNavigate={onNavigate} setSidebarOpen={setSidebarOpen} activeNavigation={activeNavigation} onSignOut={onSignOut} />
            </SheetContent>
          </Sheet>

          '''
    
    content = content.replace(old_layout_block, new_layout_block)
    
    # 4. Fix viewport wrapper
    content = content.replace(
        '<div className="mx-auto max-w-screen-2xl flex-1 w-full">',
        '<div className="mx-auto max-w-screen-2xl flex-1 w-full max-w-full overflow-x-hidden px-4 py-6 md:px-6 lg:px-8">'
    )
    
    with open('src/components/layout/DashboardShell.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    refactor()
