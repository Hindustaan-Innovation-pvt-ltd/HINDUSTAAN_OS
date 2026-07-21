import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrentUser, updateProfileOnBackend, fetchProfileFromBackend } from '@/lib/auth';
import { getProfileData, saveProfileData, type ProfileData } from '@/lib/profile';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { 
  User, Mail, Phone, Shield, Briefcase, Calendar, MapPin, 
  Globe, Building, Clock, Camera, ArrowLeft, Loader2
} from 'lucide-react';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

export default function EmployeeProfileEdit({ session, onNavigate }: { session?: any, onNavigate: (view: string) => void }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const { updateUser } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const data = getProfileData(user);
      setProfile(data);
      
      // Populate fields
      setName(data.name);
      setPhone(data.phone);
      setDepartment(data.department.toLowerCase());
      setSkillsText(data.skills.join(', '));
      setAboutMe(data.aboutMe);
      setEmergencyContact(data.emergencyContact);
      setGithub(data.github);
      setLinkedin(data.linkedin);
      setPortfolio(data.portfolio || '');
      setAvatar(data.avatar || '');

      // Load live data from backend asynchronously
      if (user.id) {
        fetchProfileFromBackend(user.id).then((freshUser) => {
          if (freshUser) {
            const freshData = getProfileData(freshUser);
            setProfile(freshData);
            setName(freshData.name);
            setPhone(freshData.phone);
            setDepartment(freshData.department.toLowerCase());
            setAvatar(freshData.avatar || '');
          }
        });
      }
    }
  }, []);

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user || !profile) {
      toast.error('Authentication Error', { description: 'Please log in again.' });
      return;
    }

    if (!name.trim()) {
      toast.error('Validation Error', { description: 'Name cannot be empty.' });
      return;
    }

    // Process skills comma-separated text into array
    const parsedSkills = skillsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const updatedProfile: ProfileData = {
      ...profile,
      name: name.trim(),
      phone: phone.trim(),
      department: department,
      skills: parsedSkills,
      aboutMe: aboutMe.trim(),
      emergencyContact: emergencyContact.trim(),
      github: github.trim(),
      linkedin: linkedin.trim(),
      portfolio: portfolio.trim(),
      avatar: avatar
    };

    // Save profile data locally (skills, emergencyContact, bios)
    saveProfileData(user.email, updatedProfile);

    // Save active user session details update
    const sessionUser = {
      ...user,
      name: name.trim(),
      department: department,
      phone: phone.trim()
    };
    localStorage.setItem('hindustaan_user', JSON.stringify(sessionUser));

    // Update global avatar in localStorage and dispatch event for header/sidebar updates
    if (avatar && !avatar.startsWith('http')) {
      localStorage.setItem(`userAvatar_${user.email.toLowerCase()}`, avatar);
    } else if (!avatar) {
      localStorage.removeItem(`userAvatar_${user.email.toLowerCase()}`);
    }
    window.dispatchEvent(new Event('avatar-updated'));

    // Update user context for name and department changes to immediately sync layout sidebar/topbar
    updateUser({
      name: name.trim(),
      department: department,
      avatar: avatar || null
    });

    // Save to backend DB
    if (user.id) {
      setIsSaving(true);
      try {
        await updateProfileOnBackend(user.id, {
          name: name.trim(),
          department: department || undefined,
          phoneWa: phone.trim() || undefined,
          avatarUrl: avatar || undefined,
        });
        toast.success('Profile Saved', { description: 'Your changes have been synced to the server.' });
      } catch (err: any) {
        toast.warning('Saved locally', { description: err.message || 'Could not sync to server.' });
      } finally {
        setIsSaving(false);
      }
    } else {
      toast.success('Profile Updated Successfully');
    }
    
    // Navigate back to view profile
    onNavigate('My Profile');
  };

  if (!profile) {
    return (
      <div className="flex h-[400px] items-center justify-center text-slate-400 dark:text-slate-500">
        <p>Loading Edit Form...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1000px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onNavigate('My Profile')} 
          className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-page-title text-slate-900 dark:text-white tracking-tight flex items-center">
            Edit Profile
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Modify your personal and professional profile information.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main Edit Form Card */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500"></div>
          
          <CardContent className="p-6 sm:p-8 space-y-8">
            
            {/* Avatar Section */}
            <AvatarUpload
              avatar={avatar}
              name={profile.name}
              role={profile.role}
              onAvatarChange={(newAvatar) => setAvatar(newAvatar)}
              email={profile.email}
            />

            {/* Form Fields Section */}
            <div className="space-y-6">
              
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter full name"
                    className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-semibold" 
                  />
                </div>

                {/* Email (Read-Only) */}
                <div className="space-y-1.5 opacity-70">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address (Read-Only)</label>
                  <Input 
                    value={profile.email} 
                    disabled 
                    className="rounded-xl bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 font-semibold text-slate-400 cursor-not-allowed" 
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="+91..."
                    className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-semibold" 
                  />
                </div>

                {/* Department (Selectable Dropdown) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Role (Read-Only) */}
                <div className="space-y-1.5 opacity-70">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role (Read-Only)</label>
                  <Input 
                    value={profile.role} 
                    disabled 
                    className="rounded-xl bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 font-semibold text-slate-400 cursor-not-allowed" 
                  />
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skills (Comma-separated)</label>
                <Input 
                  value={skillsText} 
                  onChange={(e) => setSkillsText(e.target.value)} 
                  placeholder="React, TypeScript, Tailwind CSS, Git..."
                  className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-semibold" 
                />
                <p className="text-[10px] text-slate-400 font-medium">Add multiple skills separated by commas.</p>
              </div>

              {/* About Me */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">About Me</label>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Describe yourself and your experience..."
                  rows={3}
                  className="flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* GitHub */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg> GitHub URL
                    </label>
                    <Input 
                      value={github} 
                      onChange={(e) => setGithub(e.target.value)} 
                      placeholder="https://github.com/..."
                      className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-semibold" 
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg> LinkedIn URL
                    </label>
                    <Input 
                      value={linkedin} 
                      onChange={(e) => setLinkedin(e.target.value)} 
                      placeholder="https://linkedin.com/in/..."
                      className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-semibold" 
                    />
                  </div>

                  {/* Portfolio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-green-500" /> Portfolio URL
                    </label>
                    <Input 
                      value={portfolio} 
                      onChange={(e) => setPortfolio(e.target.value)} 
                      placeholder="https://..."
                      className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-semibold" 
                    />
                  </div>
                </div>
              </div>

              {/* Read-Only Professional details hint */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/20 p-4 rounded-xl">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Read-Only Workplace Information</p>
                <div className={`grid grid-cols-2 ${session?.user?.user_metadata?.role === 'manager' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4 text-xs font-semibold`}>
                  {session?.user?.user_metadata?.role !== 'manager' && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manager</span>
                      <span className="text-slate-700 dark:text-slate-300">{profile.manager}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employment Type</span>
                    <span className="text-slate-700 dark:text-slate-300">{profile.employmentType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Joining Date</span>
                    <span className="text-slate-700 dark:text-slate-300">{profile.joiningDate}</span>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>

          <CardFooter className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onNavigate('My Profile')} 
              className="rounded-xl font-bold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              disabled={isSaving}
              onClick={handleSave} 
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 shadow-sm shadow-orange-500/10 flex items-center gap-2"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

    </div>
  );
}
