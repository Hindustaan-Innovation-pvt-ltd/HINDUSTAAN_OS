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
        The new neon P logo has significant transparent padding around the visible graphic.
        We use an overflow-hidden wrapper with scaled-up image to crop the padding 
        and make the visible logo fill the space properly.
      */}
      <div className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl",
        isAuth ? "h-20 w-20" : "h-10 w-10"
      )}>
        <img 
          src="/new-brand-logo.png" 
          alt="Project OS Logo" 
          className={cn(
            "object-contain transition-all duration-200",
            isAuth 
              ? "h-[220%] w-[220%] max-w-none" 
              : "h-[220%] w-[220%] max-w-none"
          )}
        />
      </div>
      
      <h1 className={cn(
        "tracking-tight text-slate-900 dark:text-white",
        isAuth ? "text-2xl md:text-3xl font-extrabold mt-2 flex flex-row items-center justify-center gap-2" : "text-lg ml-2 flex items-center font-bold"
      )}>
        {isAuth ? (
          <>
            Project <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent font-extrabold">OS</span>
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
