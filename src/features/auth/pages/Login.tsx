import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  KeyRound, 
  ArrowRight, 
  Loader2, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  Users, 
  TrendingUp, 
  Sparkles,
  ShieldCheck,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { loginUser, initializeAuth } from '@/lib/auth';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function Login({
  onMockLogin,
  defaultEmail = '',
  defaultName = '',
  defaultRole = 'manager',
  isAdminLogin = false
}: {
  onMockLogin?: (role: string, email?: string) => void;
  defaultEmail?: string;
  defaultName?: string;
  defaultRole?: string;
  isAdminLogin?: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Dark/Light Theme state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Required Fields', { description: 'Please enter both your work email and password.' });
      return;
    }

    setLoading(true);

    try {
      const user = await loginUser(email.trim(), password, rememberMe);
      if (!user) {
        toast.error('Authentication Failed', { description: 'Invalid email or password. Please verify your credentials.' });
        setLoading(false);
        return;
      }

      toast.success('Access Granted', { description: `Welcome back, ${user.name || 'User'}!` });

      localStorage.setItem('role', user.role);
      window.dispatchEvent(new Event('auth-login'));

      if (onMockLogin) {
        onMockLogin(user.role, email);
      } else {
        const dest = user.role === 'admin' 
          ? '/admin/dashboard' 
          : user.role === 'manager' 
            ? '/manager/dashboard' 
            : '/dashboard';
        window.location.href = dest;
      }
    } catch (err: any) {
      if (err.message && err.message.includes('User not found')) {
        toast.error('Account Not Found', {
          description: 'No registered workspace account exists with this email address.',
        });
      } else {
        toast.error('Authentication Error', { description: err.message || 'Login failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans selection:bg-orange-500 selection:text-white">

      {/* Atmospheric Ambient Lighting & Mesh Grids */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_60%,transparent_100%)]" />
        
        {/* Soft Radial Ambient Glows - Sleek Saffron & Midnight Cyan */}
        <div className="absolute -top-[25%] -left-[10%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent dark:from-orange-600/15 dark:via-amber-500/5 dark:to-transparent blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] max-w-[850px] max-h-[850px] rounded-full bg-gradient-to-tl from-cyan-600/15 via-blue-600/10 to-transparent dark:from-cyan-500/10 dark:via-indigo-600/10 dark:to-transparent blur-[140px]" />
      </div>

      {/* Top Bar Floating Controls */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Systems Operational
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm hover:shadow transition-all duration-200 text-xs font-medium cursor-pointer"
          aria-label="Toggle visual theme"
        >
          {isDark ? (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-indigo-500 group-hover:-rotate-12 transition-transform duration-300" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-10 min-h-screen flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">

          {/* Left Column: Brand Showcase & Enterprise Value Props */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center pr-4">
            {/* Enterprise Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full w-fit bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/25 text-orange-600 dark:text-orange-400 text-xs font-bold tracking-wide uppercase mb-6">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
              Enterprise Workspace OS
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white mb-5">
              Powering modern teams with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 dark:from-orange-400 dark:via-amber-400 dark:to-orange-500">
                seamless execution.
              </span>
            </h1>

            <p className="text-base xl:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed mb-8 max-w-xl">
              Hindustaan Innovations OS connects task governance, biometric attendance, milestone roadmaps, and intelligent team insights into one unified portal.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl">
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/[0.07] backdrop-blur-md shadow-xs hover:border-orange-500/30 transition-all duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-orange-500/10 text-orange-500">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Sprint & Task Governance</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  High-level Gantt timelines, active deadlines, and real-time execution cards.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/[0.07] backdrop-blur-md shadow-xs hover:border-cyan-500/30 transition-all duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-500">
                    <Users className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Workforce Management</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Real-time punch logs, leave approvals, and employee directory syncing.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/[0.07] backdrop-blur-md shadow-xs hover:border-emerald-500/30 transition-all duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Executive Analytics</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Organizational velocity, milestone delivery charts, and exportable reports.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/[0.07] backdrop-blur-md shadow-xs hover:border-purple-500/30 transition-all duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Smart Automation</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Automated notifications, email templating, and role-based workflows.
                </p>
              </div>
            </div>

            {/* Micro Live Status Pulse Preview */}
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Single Sign-On Enforced
              </span>
              <span className="h-3 w-px bg-slate-300 dark:bg-slate-800" />
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                TLS 1.3 256-Bit Encrypted
              </span>
              <span className="h-3 w-px bg-slate-300 dark:bg-slate-800" />
              <span>Hindustaan Innovations Pvt. Ltd.</span>
            </div>
          </div>

          {/* Right Column: Authentication Form Card */}
          <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-md">
              {/* Glassmorphic Card Container */}
              <div className="relative rounded-3xl bg-white/80 dark:bg-[#0c101a]/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.09] p-7 sm:p-9 shadow-2xl shadow-slate-950/10 dark:shadow-slate-950/70 transition-all duration-300">
                
                {/* Subtle Card Accent Highlight Ring */}
                <div className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-orange-500/40 dark:via-orange-400/30 to-transparent" />

                {/* Brand Logo & Header */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="mb-3">
                    <BrandLogo 
                      variant="auth-horizontal" 
                      subtitle="Internal Operations Portal" 
                      className="hover:scale-[1.01] transition-transform duration-200"
                    />
                  </div>

                  {isAdminLogin ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Administrative Gateway
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                      Enter your organizational credentials to continue
                    </p>
                  )}
                </div>

                {/* Password Login Form */}
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  {/* Work Email */}
                  <div className="space-y-1.5 text-left">
                    <label 
                      htmlFor="email" 
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                    >
                      Corporate Email
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@hindustaan.in"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/15 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label 
                        htmlFor="password" 
                        className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => toast.info('Password Reset', { description: 'Please contact your workspace manager or administrator to reset your account password.' })}
                        className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors cursor-pointer"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <KeyRound className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-2.5 pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500 dark:focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/15 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me option */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500/20 focus:ring-2 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Remember this device for 30 days
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white font-bold text-sm py-2.5 px-4 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:opacity-60 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying Identity...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Workspace</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Security Note */}
                <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 text-center">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Strict organizational portal • All sessions are encrypted & audited
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
