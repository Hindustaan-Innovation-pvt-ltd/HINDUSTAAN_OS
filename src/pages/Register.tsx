import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, User, Briefcase, Phone, Hash, ArrowRight, Loader2, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { registerUser } from '@/lib/auth';

export default function Register({ onNavigateToLogin }: { onNavigateToLogin: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: 'Engineering',
    employeeId: '',
    phone: '',
    termsAccepted: false
  });
  
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name || formData.name.length < 3 || formData.name.length > 50) {
      toast.error('Name must be between 3 and 50 characters.');
      return;
    }
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters strong.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!formData.termsAccepted) {
      toast.error('Please accept the Terms & Conditions.');
      return;
    }

    setLoading(true);

    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const success = registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as 'manager' | 'employee',
        department: formData.department,
        phone: formData.phone,
        id: formData.employeeId || undefined
      });

      if (success) {
        toast.success('Account created successfully.', { description: 'Please login.' });
        onNavigateToLogin();
      } else {
        toast.error('Email is already registered. Please login.');
      }
    } catch (error) {
      toast.error('An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans transition-colors duration-500 overflow-y-auto relative">
      {/* Background Ornaments */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="fixed -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-orange-500/20 dark:bg-orange-600/20 blur-[120px] pointer-events-none transition-colors duration-500"></div>
      <div className="fixed -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-green-500/20 dark:bg-green-600/10 blur-[120px] pointer-events-none transition-colors duration-500"></div>

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={() => setIsDark(!isDark)}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:scale-110 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 z-50 shadow-sm"
        aria-label="Toggle Dark Mode"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Registration Form */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        <div className="rounded-[24px] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
          
          <div className="flex flex-col items-center text-center mb-4">
            <img
              src="/logo.png"
              alt="Project OS Logo"
              className="mx-auto w-[120px] md:w-[150px] xl:w-[190px] h-auto object-contain transition-all duration-300 hover:scale-[1.03]"
              style={{ filter: "drop-shadow(0 0 25px rgba(91,124,255,0.25))" }}
            />
            <div className="mt-2 flex flex-col items-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Create Account
              </p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-3 mt-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <User className="h-4 w-4" />
                </div>
                <input
                  name="name"
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200"
                  placeholder="name@hindustaan.in"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {/* Role */}
                <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Role</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                    <Briefcase className="h-4 w-4" />
                    </div>
                    <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200 appearance-none"
                    >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>
                </div>

                {/* Department */}
                <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Department</label>
                <div className="relative group">
                    <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200 appearance-none"
                    >
                        <option value="Engineering">Engineering</option>
                        <option value="HR">HR</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="Operations">Operations</option>
                    </select>
                </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Employee ID */}
                <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Emp ID <span className="text-[9px] text-slate-400 normal-case">(Opt)</span></label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                    <Hash className="h-4 w-4" />
                    </div>
                    <input
                    name="employeeId"
                    type="text"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200"
                    placeholder="EMP001"
                    />
                </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone <span className="text-[9px] text-slate-400 normal-case">(Opt)</span></label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                    <Phone className="h-4 w-4" />
                    </div>
                    <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200"
                    placeholder="+91..."
                    />
                </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Password</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                    <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200"
                    placeholder="••••••••"
                    />
                </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Confirm Password</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                    <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 transition-all duration-200"
                    placeholder="••••••••"
                    />
                </div>
                </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center space-x-2 pt-0.5">
              <input
                type="checkbox"
                name="termsAccepted"
                id="terms"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <label htmlFor="terms" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                I accept the <a href="#" className="text-orange-600 hover:underline">Terms & Conditions</a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center items-center space-x-2 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-green-700 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-orange-500/30 disabled:opacity-70 disabled:hover:scale-100 transition-all duration-200 ease-out"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
            
            <div className="text-center pt-3 pb-1">
              <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Already have an account? </span>
              <button 
                type="button" 
                onClick={onNavigateToLogin}
                className="text-[13px] font-extrabold text-orange-600 hover:text-orange-700 hover:underline transition-all ml-1"
              >
                Login
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
