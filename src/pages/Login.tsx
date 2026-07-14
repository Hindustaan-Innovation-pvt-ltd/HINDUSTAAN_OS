import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, ArrowRight, Loader2, Compass, Sun, Moon, Eye, EyeOff, CheckSquare, Users, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { loginUser, getRegisteredUsers, initializeAuth } from '@/lib/auth';
import { User as UserIcon } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function Login({ 
  onMockLogin, 
  onNavigateToRegister,
  defaultEmail = '',
  defaultName = '',
  defaultRole = 'manager',
  isAdminLogin = false
}: { 
  onMockLogin?: (role: string, email?: string) => void, 
  onNavigateToRegister?: () => void,
  defaultEmail?: string,
  defaultName?: string,
  defaultRole?: string,
  isAdminLogin?: boolean
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Authentication Modes
  const [isOTPMode, setIsOTPMode] = useState(false);
  const [mockRole, setMockRole] = useState(isAdminLogin ? 'admin' : defaultRole);
  
  // OTP State
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpState, setOtpState] = useState<{ code: string; expiresAt: number } | null>(null);
  const [otpError, setOtpError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(300);

  const [isDark, setIsDark] = useState(true);

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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showOTPDialog && otpState) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((otpState.expiresAt - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining === 0) clearInterval(interval);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOTPDialog, otpState]);

  const validateUser = () => {
    const users = getRegisteredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      toast.error('Access Denied', {
        description: 'This email is not registered with Project OS.\n\nPlease contact your administrator.',
      });
      return null;
    }
    
    if (isAdminLogin && user.role !== 'admin') {
      toast.error('Unauthorized Access', {
        description: 'Invalid administrator credentials.',
      });
      return null;
    } else if (!isAdminLogin && user.role !== mockRole) {
      toast.error('Incorrect Access Type', {
        description: `Your account is registered as ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}.\n\nPlease switch to ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Access.`,
      });
      return null;
    }
    
    return user;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      const validated = validateUser();
      if (!validated) {
        setLoading(false);
        return;
      }
      
      const user = loginUser(email, password, rememberMe);
      if (!user) {
        toast.error('Authentication Error', { description: 'Incorrect password or email.' });
        setLoading(false);
        return;
      }

      if (isAdminLogin) {
        toast.success('Access granted.', { description: 'Initializing workspaces...' });
        if (onMockLogin) {
          onMockLogin('admin', user.email);
        } else {
          window.location.reload();
        }
        return;
      }
      
      if (user.role === 'employee' || user.role === 'intern' as any) {
        let userId = 'u-4';
        let userName = 'Tanvy Pandey';
        
        if (email.toLowerCase().includes('amanda')) {
          userId = 'u-1';
          userName = 'Amanda Smith';
        } else if (email.toLowerCase().includes('rahul')) {
          userId = 'u-2';
          userName = 'Rahul Sharma';
        } else if (email.toLowerCase().includes('priya')) {
          userId = 'u-3';
          userName = 'Priya Patel';
        }

        // Track specific intern login for Manager Dashboard & WorkLogs
        localStorage.setItem(`login_time_${userId}`, Date.now().toString());
        
        // Log activity to feed
        const storedFeed = localStorage.getItem('hindustaan_activity_feed');
        const feed = storedFeed ? JSON.parse(storedFeed) : [];
        const newEvent = { 
          id: Date.now().toString(), 
          user: userName, 
          action: 'logged into', 
          target: 'Project OS', 
          time: 'Just now',
          timestamp: Date.now(), 
          type: 'login' 
        };
        localStorage.setItem('hindustaan_activity_feed', JSON.stringify([newEvent, ...feed].slice(0, 20)));
      }
      
      toast.success('Access granted.', { description: 'Initializing workspaces...' });
      
      if (onMockLogin) {
        onMockLogin(user.role, email);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      toast.error('Authentication Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (targetEmail: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API

      const user = validateUser();
      if (!user) return false;

      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      
      setOtpState({ code, expiresAt });
      setCountdown(300);
      
      console.log(`[MOCK EMAIL] OTP for ${targetEmail}: ${code}`);
      return true;
    } catch (err: any) {
      toast.error('Error', { description: err.message || 'Failed to send OTP.' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await sendOTP(email);
    if (success) {
      setOtpValue('');
      setOtpError(false);
      setShowOTPDialog(true);
    }
  };

  const handleResend = async () => {
    const success = await sendOTP(email);
    if (success) {
      setOtpValue('');
      setOtpError(false);
      toast.success('New OTP Sent', { description: 'Check your email for the new verification code.' });
    }
  };

  const verifyOTP = async (targetEmail: string, inputOtp: string) => {
    setVerifying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API
      
      if (!otpState) return false;
      
      if (Date.now() > otpState.expiresAt) {
        toast.error('OTP Expired', { description: 'Please request a new verification code.' });
        return false;
      }
      
      if (inputOtp !== otpState.code) {
        toast.error('Invalid OTP', { description: 'The verification code you entered is incorrect.' });
        setOtpError(true);
        setTimeout(() => setOtpError(false), 600); // reset shake animation
        return false;
      }
      
      return true;
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async () => {
    if (otpValue.length !== 6) return;
    
    const success = await verifyOTP(email, otpValue);
    
    if (success) {
      const user = loginUser(email, undefined, rememberMe); // OTP login, no password needed
      if (user) {
        toast.success('Verification Successful', { description: 'Welcome back!' });
        setShowOTPDialog(false);
        if (onMockLogin) {
          onMockLogin(user.role, email);
        } else {
          window.location.reload();
        }
      }
    }
  };

  return (
    <div className="relative flex min-h-screen lg:h-screen lg:overflow-hidden w-full items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-orange-500/20 dark:bg-orange-600/20 blur-[120px] pointer-events-none transition-colors duration-500"></div>
      <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-green-500/20 dark:bg-green-600/10 blur-[120px] pointer-events-none transition-colors duration-500"></div>

      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:scale-110 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 z-50 shadow-sm"
        aria-label="Toggle Dark Mode"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="relative z-10 flex w-full min-h-screen lg:h-full lg:min-h-0">
        
        {/* Left Section - Branding (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col justify-center w-[45%] xl:w-[50%] p-12 xl:p-24 border-r border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-950/30 backdrop-blur-sm z-10">
          <div className="max-w-xl">
            <h1 className="text-page-title tracking-tight text-slate-900 dark:text-white mb-6 whitespace-nowrap">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-green-600">Project OS</span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-md font-medium leading-relaxed">
              The complete workspace solution to streamline your team's workflow and boost productivity.
            </p>

            <div className="space-y-6">
              {[
                { icon: <CheckSquare className="h-6 w-6 text-orange-500" />, text: "Manage Projects & Tasks" },
                { icon: <Users className="h-6 w-6 text-green-500" />, text: "Collaborate with Teams" },
                { icon: <TrendingUp className="h-6 w-6 text-blue-500" />, text: "Track Progress & Analytics" },
                { icon: <Sparkles className="h-6 w-6 text-indigo-500" />, text: "Increase Daily Productivity" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                    {feature.icon}
                  </div>
                  <span className="text-base font-semibold text-slate-700 dark:text-slate-300">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 w-full lg:w-[55%] xl:w-[50%] z-10 lg:h-full lg:overflow-y-auto py-8">
          <div className="w-full max-w-md">
            <div className="rounded-[24px] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/60 p-5 sm:p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-orange-500/30 dark:hover:border-purple-500/30 hover:shadow-[0_20px_50px_rgba(249,115,22,0.08)] dark:hover:shadow-[0_20px_50px_rgba(168,85,247,0.12)]">
              
              <div className="flex flex-col items-center text-center mb-2.5">
                <div className="hover:scale-[1.03] transition-all duration-300">
                  <BrandLogo variant="auth" />
                </div>
                <div className="mt-1 flex flex-col items-center">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Internal Workspace Portal
                  </p>
                </div>
              </div>

          <form className="space-y-3" onSubmit={isOTPMode ? handleOTPRequest : handlePasswordLogin}>
            <div className="space-y-2">
              
              <div>
                <label htmlFor="name" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <UserIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    minLength={3}
                    maxLength={50}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-orange-500/50 dark:hover:border-purple-500/50 bg-slate-50/50 dark:bg-slate-800/50 py-2 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email-address" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-orange-500/50 dark:hover:border-purple-500/50 bg-slate-50/50 dark:bg-slate-800/50 py-2 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200"
                    placeholder="name@hindustaan.in"
                  />
                </div>
              </div>

              {!isOTPMode && (
                <div className="transition-all duration-300 ease-in-out animate-in fade-in zoom-in-95">
                  <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative z-10">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <KeyRound className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required={!isOTPMode}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pointer-events-auto block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-orange-500/50 dark:hover:border-purple-500/50 bg-slate-50/50 dark:bg-slate-800/50 py-2 pl-11 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-purple-500/20 transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer z-20"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-0.5">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <label htmlFor="rememberMe" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Remember Me
              </label>
            </div>

            <div className="flex items-center justify-between pt-0.5 pb-1">
              {!isOTPMode ? (
                <button
                  type="button"
                  onClick={() => toast.success('Password reset link sent to your email.')}
                  className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider"
                >
                  Forgot Password?
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setIsOTPMode(!isOTPMode)}
                className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider"
              >
                {isOTPMode ? 'Use Password' : 'Magic Link'}
              </button>
            </div>

            {!isAdminLogin && (
              <div className="flex items-center justify-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => setMockRole('manager')}
                  className={cn(
                    "flex-1 py-1 text-[11px] font-bold rounded-lg transition-all",
                    mockRole === 'manager' 
                      ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Manager Access
                </button>
                <button
                  type="button"
                  onClick={() => setMockRole('employee')}
                  className={cn(
                    "flex-1 py-1 text-[11px] font-bold rounded-lg transition-all",
                    mockRole === 'employee' 
                      ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Employee Access
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center items-center space-x-2 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-green-700 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-orange-500/30 disabled:opacity-70 disabled:hover:scale-100 transition-all duration-200 ease-out"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>{isOTPMode ? 'Send Verification Code' : 'Secure Log In'}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
            
            {!isAdminLogin ? (
              <>
                <div className="text-center pt-2 pb-0.5">
                  <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Don't have an account? </span>
                  <button 
                    type="button" 
                    onClick={onNavigateToRegister}
                    className="text-[13px] font-extrabold text-orange-600 hover:text-orange-700 hover:underline transition-all ml-1"
                  >
                    Create Account
                  </button>
                </div>
                <div className="text-center pt-1 pb-0.5">
                  <button 
                    type="button" 
                    onClick={() => {
                      window.location.href = '/admin/login';
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4"
                  >
                    Administrator Access
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center pt-2 pb-0.5">
                <button 
                  type="button" 
                  onClick={() => {
                    window.location.href = '/login';
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4"
                >
                  Return to Employee/Manager Login
                </button>
              </div>
            )}
          </form>
        </div>
        </div>
      </div>
      </div>

      {/* OTP Verification Modal */}
      <Dialog open={showOTPDialog} onOpenChange={(open) => !verifying && setShowOTPDialog(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Your Email</DialogTitle>
            <DialogDescription>
              We've sent a 6-digit verification code to your registered email address.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className={cn("transition-transform", otpError && "animate-shake")}>
              <InputOTP 
                maxLength={6} 
                value={otpValue} 
                onChange={setOtpValue} 
                disabled={verifying || countdown === 0}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <div className="flex w-full flex-col items-center gap-2">
              <Progress value={(countdown / 300) * 100} className="h-2 w-full" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} remaining
              </span>
            </div>
            
            {countdown === 0 && (
              <Alert variant="destructive">
                <AlertTitle>OTP Expired</AlertTitle>
                <AlertDescription>Please request a new verification code.</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowOTPDialog(false)} 
              disabled={verifying}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white"
            >
              Change Email
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleResend} 
              disabled={loading || verifying}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend OTP
            </Button>
            <Button 
              type="button" 
              onClick={handleVerify} 
              disabled={otpValue.length !== 6 || verifying || countdown === 0}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
