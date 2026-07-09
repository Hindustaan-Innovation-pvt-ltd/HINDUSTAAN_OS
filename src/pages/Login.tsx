import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, ArrowRight, Loader2, Compass, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const approvedUsers = [
  { id: "EMP001", name: "Employee One", email: "employee1@hindustaan.in", role: "employee" },
  { id: "EMP002", name: "Employee Two", email: "employee2@hindustaan.in", role: "employee" },
  { id: "MGR001", name: "Manager One", email: "manager1@hindustaan.in", role: "manager" }
];

export default function Login({ onMockLogin }: { onMockLogin?: (role: string, email?: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Missing states and mock config variables
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | ''; text: string } | null>(null);
  const supabaseUrl = 'https://placeholder.supabase.co';
  const supabase = {
    auth: {
      signInWithOtp: async (args: any) => ({ data: {}, error: null })
    }
  };
  
  // Authentication Modes
  const [isOTPMode, setIsOTPMode] = useState(false);
  const [mockRole, setMockRole] = useState('manager');
  
  // OTP State
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpState, setOtpState] = useState<{ code: string; expiresAt: number } | null>(null);
  const [otpError, setOtpError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(300);

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    let interval: any;
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
    const user = approvedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      toast.error('Access Denied', {
        description: 'This email is not registered with Hindustaan OS.\n\nPlease contact your administrator.',
      });
      return null;
    }
    
    if (user.role !== mockRole) {
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
      if (supabaseUrl.includes('placeholder')) {
        setTimeout(() => {
          setStatusMessage({
            type: 'success',
            text: '✓ Access granted (Mock Mode). Initializing workspaces...',
          });
          
          if (mockRole === 'intern') {
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
              target: 'Hindustaan OS', 
              time: 'Just now', 
              type: 'login' 
            };
            localStorage.setItem('hindustaan_activity_feed', JSON.stringify([newEvent, ...feed].slice(0, 20)));
          }
          
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
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API
        
        const user = validateUser();
        if (!user) return;
        
        localStorage.setItem('hindustaan_user', JSON.stringify(user));
        toast.success('Access granted.', { description: 'Initializing workspaces...' });
        
        if (onMockLogin) {
          onMockLogin(user.role);
        } else {
          window.location.reload();
        }
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
      const user = approvedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        localStorage.setItem('hindustaan_user', JSON.stringify(user));
        toast.success('Verification Successful', { description: 'Welcome back!' });
        setShowOTPDialog(false);
        if (onMockLogin) {
          onMockLogin(user.role);
        } else {
          window.location.reload();
        }
      }
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans">
      
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

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        <div className="rounded-[2rem] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/60 p-8 sm:p-10 shadow-2xl backdrop-blur-xl transition-all duration-500">
          
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

          <form className="space-y-6" onSubmit={isOTPMode ? handleOTPRequest : handlePasswordLogin}>
            <div className="space-y-5">
              
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

              {!isOTPMode && (
                <div className="transition-all duration-300 ease-in-out animate-in fade-in zoom-in-95">
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
                      required={!isOTPMode}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-3.5 pl-12 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 pb-2">
              {!isOTPMode ? (
                <button
                  type="button"
                  onClick={() => toast.success('Password reset link sent to your email.')}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider"
                >
                  Forgot Password?
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setIsOTPMode(!isOTPMode)}
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider"
              >
                {isOTPMode ? 'Use Password Instead' : 'Login with OTP'}
              </button>
            </div>

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
                onClick={() => setMockRole('employee')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                  mockRole === 'employee' 
                    ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Employee Access
              </button>
            </div>

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
                    <span>{isOTPMode ? 'Send Verification Code' : 'Secure Log In'}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

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
