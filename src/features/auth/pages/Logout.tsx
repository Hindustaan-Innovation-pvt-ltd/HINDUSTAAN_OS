import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Clock, Sparkles, CheckCircle2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { logoutUser } from '@/lib/auth';

export default function Logout() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const totalSeconds = 5;

  useEffect(() => {
    // Ensure thorough cleanup on both client and server when landing on this page
    const performCleanup = async () => {
      try {
        await logoutUser();
      } catch (err) {
        console.error('Error during final logout cleanup:', err);
      } finally {
        localStorage.removeItem('hindustaan_user');
        sessionStorage.removeItem('hindustaan_user');
        window.dispatchEvent(new Event('auth-logout'));
      }
    };
    performCleanup();

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const progressPercentage = ((totalSeconds - countdown) / totalSeconds) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white relative overflow-hidden">
      
      {/* Background Glowing Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-orange-500/15 via-amber-500/10 to-green-500/15 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-gradient-to-br from-emerald-500/10 to-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-md mx-auto">
        {/* Logo Header */}
        <div className="flex justify-center mb-8">
          <BrandLogo variant="auth" />
        </div>

        {/* Main Glassmorphic Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-black/60 relative overflow-hidden text-center">
          
          {/* Top Decorative Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-green-600" />

          {/* Shield Icon Badge */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-green-500/20 via-emerald-500/15 to-teal-500/20 border border-green-500/30 flex items-center justify-center mb-6 shadow-lg shadow-green-500/10 animate-bounce-slow">
            <ShieldCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
            Signed Out Safely
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
            You have been successfully and securely logged out of your <span className="font-semibold text-slate-800 dark:text-slate-200">Hindustaan Project OS</span> workspace.
          </p>

          {/* Security Features Check Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-4 text-left mb-8 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span>Session tokens & cookies terminated</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span>Real-time Socket.IO sync disconnected</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              <Lock className="w-4 h-4 text-green-500 shrink-0" />
              <span>Workspace memory buffers cleared</span>
            </div>
          </div>

          {/* Countdown Timer Box */}
          <div className="bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-8">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Redirecting to Login</span>
              </span>
              <span>{countdown}s</span>
            </div>
            
            {/* Custom Progress Bar */}
            <div className="w-full h-2 bg-orange-500/15 dark:bg-orange-500/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${100 - progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-green-600 hover:opacity-95 text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In Again</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

        </div>

        {/* Footer Note */}
        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Hindustaan Project OS. All rights reserved.
        </p>
      </div>

    </div>
  );
}
