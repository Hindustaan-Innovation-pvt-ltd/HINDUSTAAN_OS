import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, User, Briefcase, Phone, Hash, ArrowRight, Loader2, Sun, Moon, AlertCircle, Eye, EyeOff, CheckSquare, Users, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { registerUser } from '@/lib/auth';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(['employee', 'manager']),
  designation: z.string().optional(),
  department: z.string(),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Register({ onNavigateToLogin }: { onNavigateToLogin: (email?: string, name?: string, role?: string) => void }) {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
      designation: 'Frontend Developer',
      department: 'Engineering',
      employeeId: '',
      phone: '',
      termsAccepted: false
    }
  });

  const selectedRole = watch('role');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const success = registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        designation: data.role === 'employee' ? data.designation : undefined,
        department: data.department,
        phone: data.phone,
        id: data.employeeId || undefined
      });

      if (success) {
        toast.success('Account created successfully.', { description: 'Please login.' });
        onNavigateToLogin(data.email, data.name, data.role);
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
    <div className="relative flex min-h-screen w-full overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans">
      {/* Background Ornaments */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="fixed -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-orange-500/20 dark:bg-orange-600/20 blur-[120px] pointer-events-none transition-colors duration-500"></div>
      <div className="fixed -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-green-500/20 dark:bg-green-600/10 blur-[120px] pointer-events-none transition-colors duration-500"></div>

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={() => setIsDark(!isDark)}
        className="fixed top-6 right-6 p-2.5 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:scale-110 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 z-50 shadow-sm"
        aria-label="Toggle Dark Mode"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="relative z-10 flex w-full min-h-screen">
        
        {/* Left Section - Branding (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col justify-center w-[45%] xl:w-[50%] p-12 xl:p-24 border-r border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-950/30 backdrop-blur-sm z-10">
          <div className="max-w-xl">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 whitespace-nowrap">
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

        {/* Right Section - Register Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 w-full lg:w-[55%] xl:w-[50%] z-10 py-16">
          <div className="w-full max-w-md">
            <div className="rounded-[24px] border border-white/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
          
          <div className="flex flex-col items-center text-center mb-4">
            <div className="hover:scale-[1.03] transition-all duration-300">
              <BrandLogo variant="auth" />
            </div>
            <div className="mt-2 flex flex-col items-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Create Account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  {...register("name")}
                  className={cn("block w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 transition-all duration-200", errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 dark:border-slate-700/50 focus:border-orange-500 focus:ring-orange-500/10 dark:focus:ring-orange-500/20")}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && <p className="text-[10px] text-red-500 font-medium flex items-center mt-1"><AlertCircle className="w-3 h-3 mr-1"/>{errors.name.message}</p>}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  {...register("email")}
                  className={cn("block w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 transition-all duration-200", errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 dark:border-slate-700/50 focus:border-orange-500 focus:ring-orange-500/10 dark:focus:ring-orange-500/20")}
                  placeholder="name@hindustaan.in"
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-medium flex items-center mt-1"><AlertCircle className="w-3 h-3 mr-1"/>{errors.email.message}</p>}
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
                    {...register("role")}
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
                    {...register("department")}
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

            {/* Dynamic Designation for Employee */}
            {selectedRole === 'employee' && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Designation / Specialization</label>
                <Controller
                  name="designation"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 h-[42px] px-4 text-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-orange-500/10">
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                        <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                        <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                        <SelectItem value="Product Manager">Product Manager</SelectItem>
                        <SelectItem value="App Developer">App Developer</SelectItem>
                        <SelectItem value="Graphic Designer">Graphic Designer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  {...register("phone")}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
                  placeholder="+91..."
                />
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
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={cn("block w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-11 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 transition-all duration-200", errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 dark:border-slate-700/50 focus:border-orange-500 focus:ring-orange-500/10")}
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
                {errors.password && <p className="text-[10px] text-red-500 font-medium flex items-center mt-1"><AlertCircle className="w-3 h-3 mr-1"/>{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Confirm Password</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                    <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className={cn("block w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-11 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 transition-all duration-200", errors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 dark:border-slate-700/50 focus:border-orange-500 focus:ring-orange-500/10")}
                    placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 cursor-pointer z-20"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                </div>
                {errors.confirmPassword && <p className="text-[10px] text-red-500 font-medium flex items-center mt-1"><AlertCircle className="w-3 h-3 mr-1"/>{errors.confirmPassword.message}</p>}
                </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2 pt-0.5">
                <input
                  type="checkbox"
                  id="terms"
                  {...register("termsAccepted")}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900"
                />
                <label htmlFor="terms" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  I accept the <span onClick={() => setShowTerms(true)} className="text-orange-600 hover:underline cursor-pointer">Terms & Conditions</span>
                </label>
              </div>
              {errors.termsAccepted && <p className="text-[10px] text-red-500 font-medium flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.termsAccepted.message}</p>}
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
                onClick={() => onNavigateToLogin()}
                className="text-[13px] font-extrabold text-orange-600 hover:text-orange-700 hover:underline transition-all ml-1"
              >
                Login
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>

    {/* Terms and Conditions Modal */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="sm:max-w-[500px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-2xl rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Project OS Terms & Conditions</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p className="flex items-start"><span className="mr-2 font-bold text-orange-500">1.</span> Employees must use valid company information while creating an account.</p>
            <p className="flex items-start"><span className="mr-2 font-bold text-orange-500">2.</span> User credentials are confidential and must not be shared.</p>
            <p className="flex items-start"><span className="mr-2 font-bold text-orange-500">3.</span> The platform tracks tasks, work logs, attendance, standups, and project activity.</p>
            <p className="flex items-start"><span className="mr-2 font-bold text-orange-500">4.</span> Any misuse of company data may lead to account suspension.</p>
            <p className="flex items-start"><span className="mr-2 font-bold text-orange-500">5.</span> Managers have access to team management features.</p>
            <p className="flex items-start"><span className="mr-2 font-bold text-orange-500">6.</span> Project OS stores profile information securely.</p>
            <p className="flex items-start"><span className="mr-2 font-bold text-orange-500">7.</span> Users agree to receive OTP emails and system notifications.</p>
          </div>
          <div className="flex justify-end space-x-3 mt-2">
            <Button variant="outline" onClick={() => setShowTerms(false)} className="rounded-xl border-slate-200 dark:border-slate-700">Close</Button>
            <Button 
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20"
              onClick={() => {
                setValue('termsAccepted', true, { shouldValidate: true });
                setShowTerms(false);
              }}
            >
              Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
