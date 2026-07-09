import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { KeyRound, Mail, ArrowRight, Loader2, Compass, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Initialize the local Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Login({ onMockLogin }: { onMockLogin?: (role: string, email?: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mockRole, setMockRole] = useState('manager');

  // Dark mode state - defaulting to true for that rich, professional dark look they liked
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      if (supabaseUrl.includes('placeholder')) {
        setTimeout(() => {
          setStatusMessage({
            type: 'success',
            text: '✓ Access granted (Mock Mode). Initializing workspaces...',
          });
          if (onMockLogin) onMockLogin(mockRole, email);
        }, 800);
        return;
      }

      if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setStatusMessage({
          type: 'success',
          text: '✨ Verification link dispatched! Check your email inbox.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setStatusMessage({
          type: 'success',
          text: '✓ Access granted. Initializing workspaces...',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An error occurred during verification. Please check details.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans">
      
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      {/* Smooth, blurred radial gradient glows (SaaS Depth) - Adjusted to Orange and Green */}
      <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-orange-500/20 dark:bg-orange-600/20 blur-[120px] pointer-events-none transition-colors duration-500"></div>
      <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-green-500/20 dark:bg-green-600/10 blur-[120px] pointer-events-none transition-colors duration-500"></div>

      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:scale-110 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 z-50 shadow-sm"
        aria-label="Toggle Dark Mode"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Main Glassmorphism Login Card */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        <div className="rounded-[2rem] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/60 p-8 sm:p-10 shadow-2xl backdrop-blur-xl transition-all duration-500">
          
          {/* Card Header & Branding */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-green-600 text-white shadow-lg shadow-orange-500/30 mb-5">
              <Compass className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">
              <span className="text-orange-500">Hi</span>ndustaan <span className="text-green-500">OS</span>
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              Internal Workspace Portal
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleAuthentication}>
            
            {/* Status Feedbacks */}
            {statusMessage && (
              <div
                className={cn(
                  "rounded-xl p-4 text-sm font-medium border shadow-sm transition-all duration-300 ease-in-out",
                  statusMessage.type === 'success'
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                )}
              >
                {statusMessage.text}
              </div>
            )}

            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email-address" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-3.5 pl-12 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200"
                    placeholder="name@hindustaan.in"
                  />
                </div>
              </div>

              {/* Password Input */}
              {!isMagicLink && (
                <div className="transition-all duration-300 ease-in-out">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <KeyRound className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required={!isMagicLink}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-3.5 pl-12 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Link & Forgot Password */}
            <div className="flex items-center justify-between pt-1 pb-2">
              {!isMagicLink ? (
                <button
                  type="button"
                  onClick={() => setStatusMessage({ type: 'success', text: 'Password reset link sent to your email.' })}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider"
                >
                  Forgot Password?
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => {
                  setIsMagicLink(!isMagicLink);
                  setStatusMessage(null);
                }}
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider"
              >
                {isMagicLink ? 'Use Password Instead' : 'Request Magic Link'}
              </button>
            </div>

            {/* Role Toggle UI */}
            <div className="flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-full">
              <button
                type="button"
                onClick={() => setMockRole('manager')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                  mockRole === 'manager' 
                    ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Manager Access
              </button>
              <button
                type="button"
                onClick={() => setMockRole('intern')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                  mockRole === 'intern' 
                    ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Employee Access
              </button>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center items-center space-x-2 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-green-700 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-orange-500/30 disabled:opacity-70 disabled:hover:scale-100 transition-all duration-200 ease-out"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>{isMagicLink ? 'Send Magic Link' : 'Secure Log In'}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
      
    </div>
  );
}
