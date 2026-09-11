import React from 'react';
import { cn } from "@/lib/utils";

import brandLogoImg from '@/assets/Frame 134.png';
import { useTheme } from '@/context/ThemeContext';

export interface BrandLogoProps {
  variant?: 'auth' | 'sidebar' | 'minimized' | 'auth-horizontal';
  subtitle?: string;
  className?: string;
  showContainerInLight?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  variant = 'sidebar', 
  subtitle,
  className,
  showContainerInLight = true
}) => {
  const isAuth = variant === 'auth';
  const isAuthHorizontal = variant === 'auth-horizontal';
  const isMinimized = variant === 'minimized';

  let isLight = false;
  try {
    const themeContext = useTheme();
    isLight = themeContext.theme === 'light';
  } catch {
    isLight = typeof document !== 'undefined' && !document.documentElement.classList.contains('dark');
  }

  // Horizontal layout: Logo on the left under container, workspace portal & brand on the right
  if (isAuthHorizontal) {
    return (
      <div className={cn("flex items-center gap-3.5 select-none", className)}>
        {/* Prominent container in light mode according to theme */}
        <div className={cn(
          "relative shrink-0 flex items-center justify-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300",
          // Light mode: deep obsidian slate with subtle orange accent ring & shadow for maximum prominence
          "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/90 shadow-xl shadow-slate-950/25 ring-1 ring-orange-500/20",
          // Dark mode: seamless integration with deep dark theme
          "dark:bg-slate-950/90 dark:border-slate-800 dark:ring-white/10 dark:shadow-md"
        )}>
          <img 
            src={brandLogoImg} 
            alt="Hindustaan Innovations Logo" 
            className="h-10 sm:h-11 w-auto max-w-[44px] object-contain"
          />
        </div>

        {/* Brand & Portal Text beside the logo */}
        <div className="flex flex-col text-left justify-center">
          <span className="font-black text-xl sm:text-2xl tracking-tight font-sans text-slate-900 dark:text-white leading-tight whitespace-nowrap">
            Hindustaan Innovations
          </span>
          <span className="font-bold text-xs sm:text-sm tracking-wide text-slate-900 dark:text-white mt-0.5 whitespace-nowrap">
            Private Limited
          </span>
          {subtitle && subtitle !== 'Private Limited' && subtitle !== 'Pvt. Ltd.' && (
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center bg-transparent border-none shadow-none select-none", 
      isAuth ? "flex-col items-center text-center" : "flex-row",
      className
    )}>
      <div className={cn(
        "relative flex items-center justify-center transition-all duration-200",
        isAuth && "p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/90 shadow-xl shadow-slate-950/25 ring-1 ring-orange-500/20 dark:bg-slate-950/90 dark:border-slate-800 dark:ring-white/10 dark:shadow-md",
        !isAuth && isLight && showContainerInLight && "p-1.5 rounded-xl bg-slate-950 border border-slate-800 shadow-sm"
      )}>
        <img 
          src={brandLogoImg} 
          alt="Hindustaan Innovation Logo" 
          className={cn(
            "object-contain transition-all duration-200",
            isAuth ? "h-14 w-auto max-w-[140px]" : "h-8.5 w-auto max-w-[120px]"
          )}
        />
      </div>
      {!isMinimized && (
        <div className={cn("flex flex-col justify-center", isAuth ? "items-center text-center mt-3" : "text-left ml-3")}>
          <span className={cn(
            "font-black tracking-tight font-sans transition-all duration-200 whitespace-nowrap leading-tight",
            "text-slate-900 dark:text-white",
            isAuth ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"
          )}>
            Hindustaan Innovations
          </span>
          <span className={cn(
            "font-bold tracking-wide transition-all duration-200 whitespace-nowrap leading-none",
            "text-slate-900 dark:text-white",
            isAuth ? "text-sm sm:text-base mt-1" : "text-xs mt-0.5"
          )}>
            Private Limited
          </span>
          {subtitle && subtitle !== 'Private Limited' && subtitle !== 'Pvt. Ltd.' && (
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5 tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
