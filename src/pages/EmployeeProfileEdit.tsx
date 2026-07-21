import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function EmployeeProfileEdit() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const navigate = useNavigate();
  const { updateUser } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const data = getProfileData(user);
      setProfile(data);
      
      // Populate fields
      setName(data.name);
      setPhone(data.phone);
      setDepartment(data.department || '');
      setEmergencyContact(data.emergencyContact);
      setAvatar(data.avatar || '');

      // Load live data from backend asynchronously
      if (user.id) {
        fetchProfileFromBackend(user.id).then((freshUser) => {
          if (freshUser) {
            const freshData = getProfileData(freshUser);
            setProfile(freshData);
            setName(freshData.name);
            setPhone(freshData.phone);
            setDepartment(freshData.department || '');
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

    const updatedProfile: ProfileData = {
      ...profile,
      name: name.trim(),
      phone: phone.trim(),
      department: department,
      emergencyContact: emergencyContact.trim(),
      avatar: avatar
    };

    // Save profile data locally (skills, emergencyContact, bios)
    saveProfileData(user.email, updatedProfile);

    // 2. Update user context immediately so sidebar/topbar re-renders
    updateUser({
      name: name.trim(),
      department: department
    });

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
    navigate('/profile');
  };

  if (!profile) {
    return (
      <div className="flex h-100 items-center justify-center text-slate-400 dark:text-slate-500">
        <p>Loading Edit Form...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-250 mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/profile')} 
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
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
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



              {/* Read-Only Professional details hint */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/20 p-4 rounded-xl">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Read-Only Workplace Information</p>
                <div className={`grid grid-cols-2 ${profile.role === 'manager' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4 text-xs font-semibold`}>
                  {profile.role !== 'manager' && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manager</span>
                      <span className="text-slate-700 dark:text-slate-300">{profile.manager}</span>
                    </div>
                  )}
                  <div className="space-y-1">
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
              onClick={() => navigate('/profile')} 
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
