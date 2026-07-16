import React from 'react';
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: 'auth' | 'sidebar' | 'minimized';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'sidebar', className }) => {
  const isAuth = variant === 'auth';
  const isMinimized = variant === 'minimized';
  
  return (
    <div className={cn(
      "flex items-center bg-transparent border-none shadow-none select-none", 
      isAuth ? "flex-col items-center text-center" : "flex-row",
      className
    )}>
      <div className="relative flex items-center justify-center drop-shadow-md dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
        <img 
          src="/project-os-logo-new.png" 
          alt="Project OS Logo" 
          className={cn(
            "object-contain transition-all duration-200",
            isAuth ? "h-24 w-auto max-w-[250px]" : "h-9 w-auto max-w-[150px]"
          )}
        />
      </div>
      {!isMinimized && (
        <span className={cn(
          "font-black tracking-tight font-sans transition-all duration-200 whitespace-nowrap",
          isAuth 
            ? "text-3xl mt-3 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-green-600 dark:from-orange-400 dark:via-orange-500 dark:to-green-500 drop-shadow-sm" 
            : "text-xl ml-3 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-green-600 dark:from-orange-400 dark:via-orange-500 dark:to-green-500 drop-shadow-sm"
        )}>
          Project OS
        </span>
      )}
    </div>
  );
};
