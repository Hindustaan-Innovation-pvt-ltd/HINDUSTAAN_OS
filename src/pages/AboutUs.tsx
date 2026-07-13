import React from 'react';
import { Building2, MapPin, Terminal, MonitorSmartphone, Globe, Activity, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AboutUs() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">System Documentation</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Corporate Overview & Platform Specifications.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* SECTION 1: CORPORATE OVERVIEW */}
          <div className="p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden group">
            {/* Background Graphic */}
            <div className="absolute -top-12 -right-12 text-slate-50 dark:text-slate-950 opacity-50 transform rotate-12 transition-transform duration-1000 group-hover:rotate-0">
              <Globe className="w-64 h-64" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                  <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Hindustaan Innovations Pvt. Ltd.</h3>
                  <div className="flex items-center text-xs font-semibold text-orange-600 dark:text-orange-400 mt-1 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    Raipur, Chhattisgarh, India
                  </div>
                </div>
              </div>
              
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 tracking-wide">Engineering the Future of Workplace Productivity</h4>
              
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Hindustaan Innovations Pvt. Ltd. is a forward-thinking technology and research firm dedicated to developing cutting-edge digital solutions, automation pipelines, and robust software architectures. Anchored in Raipur, our mission is to empower the next generation of technical professionals through intensive, full-stack ecosystem mentorship, fast-paced product development cycles, and high-impact digital transformation initiatives.
              </p>
            </div>
          </div>

          {/* SECTION 2: SYSTEM ARCHITECTURE SPECIFICATION */}
          <div className="p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden group">
             {/* Background Graphic */}
             <div className="absolute -bottom-12 -right-12 text-slate-50 dark:text-slate-950 opacity-50 transform -rotate-12 transition-transform duration-1000 group-hover:rotate-0">
              <Terminal className="w-64 h-64" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                  <MonitorSmartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">About Hindustaan OS</h3>
                  <div className="flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider">
                    Internal Workforce Productivity Platform (v1.0)
                  </div>
                </div>
              </div>
              
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 tracking-wide">A Single, Synchronized Source of Truth</h4>
              
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Hindustaan OS is the internal operating system custom-engineered to streamline how our teams execute, plan, and analyze daily operations. Purpose-built for high-speed, fast-moving product teams, Hindustaan OS replaces fragmented manual updates and lossy documentation with a single, synchronized source of truth. By seamlessly unifying task boards, milestone tracking engines, and granular work logs via web and integrated WhatsApp API layers, it enables developers and managers to maximize accountability and deliver clean output tracking daily.
              </p>
            </div>
          </div>

        </div>

        {/* Meta Info Footer Grid */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 p-6">
            
            <div className="flex items-center justify-center p-3 sm:p-0 space-x-3">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Headquarters</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Raipur, IN</span>
              </div>
            </div>

            <div className="flex items-center justify-center p-3 sm:p-0 space-x-3">
              <Activity className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Deployment Status</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phase 1 MVP</span>
              </div>
            </div>

            <div className="flex items-center justify-center p-3 sm:p-0 space-x-3">
              <ShieldCheck className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Access Scope</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Internal & Confidential</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
