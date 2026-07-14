import React from 'react';
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: 'auth' | 'sidebar' | 'minimized';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'sidebar', className }) => {
  const isAuth = variant === 'auth';
  
  return (
    <div className={cn(
      "flex items-center bg-transparent border-none shadow-none", 
      isAuth ? "flex-col items-center text-center" : "flex-row",
      className
    )}>
      <div className="relative flex items-center justify-center drop-shadow-md dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
        <img 
          src="/project-os-logo-new.png" 
          alt="Project OS Logo" 
          className={cn(
            "object-contain transition-all duration-200",
            isAuth ? "h-32 w-auto max-w-[250px]" : "h-9 w-auto max-w-[150px]"
          )}
        />
      </div>
    </div>
  );
};
