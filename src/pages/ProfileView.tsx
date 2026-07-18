import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/lib/auth';
import { getProfileData, type ProfileData } from '@/lib/profile';
import { 
  User, Mail, Phone, Shield, Briefcase, Calendar, MapPin, 
  Globe, Building, Clock, Edit, CheckCircle2,
  AlertCircle, ShieldCheck
} from 'lucide-react';

export default function ProfileView({ session, onNavigate }: { session?: any, onNavigate: (view: string) => void }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const data = getProfileData(user);
      setProfile(data);
    }
  }, []);

  if (!profile) {
    return (
      <div className="flex h-[400px] items-center justify-center text-slate-400 dark:text-slate-500">
        <p>Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
            <User className="mr-3 h-8 w-8 text-orange-500" />
            My Profile
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
            View your personal profile, credentials, and workspace information.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Main Card, Skills, Social Links) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Hero Profile Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            {/* Background Accent Gradient */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-green-600"></div>
            
            <CardContent className="p-6 pt-8 flex flex-col items-center text-center relative">
              
              {/* Edit Profile Button (Top Right) */}
              <button
                onClick={() => onNavigate('Edit Profile')}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition-all shadow-sm flex items-center justify-center"
                title="Edit Profile"
              >
                <Edit className="h-4 w-4" />
              </button>

              {/* Avatar */}
              <Avatar className="h-28 w-28 border-4 border-slate-50 dark:border-slate-900 shadow-md">
                {profile.avatar && <AvatarImage src={profile.avatar} />}
                <AvatarFallback className="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-3xl font-black">
                  {profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              {/* Basic Details */}
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">{profile.name}</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">{profile.role}</p>

              <div className="w-full border-t border-slate-100 dark:border-slate-800/80 mt-6 pt-4 text-left space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">About Me</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {profile.aboutMe || 'No description provided.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Skills Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Skills</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-3">
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, idx) => (
                    <Badge key={idx} className="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-200/30 dark:border-orange-500/10 font-bold rounded-lg px-2.5 py-1 text-xs">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 font-medium">No skills added yet.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social Links Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Social Links</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-3">
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-all font-semibold text-sm">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  GitHub Profile
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-all font-semibold text-sm">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn Profile
                </a>
              )}
              {profile.portfolio && (
                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-all font-semibold text-sm">
                  <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Personal Portfolio
                </a>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Personal, Professional, Account Details) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Personal Information */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <User className="mr-2.5 h-5 w-5 text-orange-500" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">{profile.name}</p>
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200 break-all">{profile.email}</p>
                    <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20 text-[10px] font-bold py-0 px-2 rounded-md shrink-0">Verified</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">{profile.phone}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200 capitalize">{profile.department}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">{profile.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Briefcase className="mr-2.5 h-5 w-5 text-orange-500" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {session?.user?.user_metadata?.role !== 'manager' && session?.user?.user_metadata?.role !== 'admin' && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reporting Manager</span>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">{profile.manager}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employment Type</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {session?.user?.user_metadata?.role === 'admin' ? 'Admin' : profile.employmentType}
                  </p>
                </div>
                {session?.user?.user_metadata?.role !== 'manager' && session?.user?.user_metadata?.role !== 'admin' && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team</span>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">{profile.team}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Joining Date</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">{profile.joiningDate}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work Mode</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">{profile.workMode}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/20">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-transparent">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center uppercase tracking-wider">
                <Clock className="mr-2 h-4 w-4 text-orange-500" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Created</span>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{profile.accountCreated}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Login</span>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{profile.lastLogin}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Verification Status</span>
                  <p className="text-sm font-bold text-emerald-600 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" /> Verified
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
