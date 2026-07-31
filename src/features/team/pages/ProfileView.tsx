import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const data = getProfileData(user);
      setProfile(data);
    }
  }, []);

  if (!profile) {
    return (
      <div className="flex h-100 items-center justify-center text-slate-400 dark:text-slate-500">
        <p>Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-350 mx-auto space-y-6 animate-in fade-in duration-500">
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
            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-orange-500 to-green-600"></div>
            
            <CardContent className="p-6 pt-8 flex flex-col items-center text-center relative">
              
              {/* Edit Profile Button (Top Right) */}
              <button
                onClick={() => navigate('/profile/edit')}
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
                {profile.role !== 'manager' && profile.role !== 'admin' && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reporting Manager</span>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">{profile.manager}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employment Type</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {profile.role === 'admin' ? 'Admin' : profile.employmentType}
                  </p>
                </div>
                {profile.role !== 'manager' && profile.role !== 'admin' && (
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
