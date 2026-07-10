import React from 'react';
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: 'auth' | 'sidebar';
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
      {/* 
        Image wrapper with light drop-shadow/mix-blend for canvas sanitization.
        This allows the white circle in the PNG to pop cleanly on both light and dark themes 
      */}
      <div className="relative flex items-center justify-center drop-shadow-md dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
        <img 
          src="/project-os-logo-new.png" 
          alt="Project OS Logo" 
          className={cn(
            "object-contain transition-all duration-200",
            isAuth ? "h-32 w-32" : "h-9 w-9"
          )}
        />
      </div>
      
      <h1 className={cn(
        "tracking-tight text-slate-900 dark:text-white",
        isAuth ? "text-3xl md:text-4xl font-extrabold mt-3 flex flex-col items-center" : "text-lg ml-2 flex items-center font-bold"
      )}>
        {isAuth ? (
          <>
            Project <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent font-extrabold block">OS</span>
          </>
        ) : (
          <>
            Project <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent font-extrabold ml-1.5">OS</span>
          </>
        )}
      </h1>
    </div>
  );
};
