import React, { useRef } from 'react';
import { Camera, Upload, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface AvatarUploadProps {
  avatar: string;
  name: string;
  role: string;
  onAvatarChange: (newAvatar: string) => void;
  email: string;
}

export function AvatarUpload({ avatar, name, role, onAvatarChange, email }: AvatarUploadProps) {
  const { updateUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        // Compress image using canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          onAvatarChange(compressedDataUrl);
          
          // Sync localStorage and context immediately
          const emailKey = email.toLowerCase();
          localStorage.setItem(`userAvatar_${emailKey}`, compressedDataUrl);
          updateUser({ avatar: compressedDataUrl });
          
          toast.success('Profile picture updated successfully.');
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const emailKey = email.toLowerCase();

      // 1. Supabase deletion flow if active
      if (supabase && avatar && !avatar.startsWith('data:')) {
        const fileName = avatar.substring(avatar.lastIndexOf('/') + 1);
        
        // Remove from storage
        const { error: storageError } = await supabase.storage.from('avatars').remove([fileName]);
        if (storageError) throw storageError;

        // Update profiles table
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .eq('email', email);
        if (dbError) throw dbError;
      }

      // 2. Clear state and localStorage
      onAvatarChange('');
      localStorage.removeItem(`userAvatar_${emailKey}`);
      
      // Update global context to null
      updateUser({ avatar: null });

      // Trigger custom event for sync
      window.dispatchEvent(new Event('avatar-updated'));

      toast.success('Profile picture removed successfully.');
    } catch (err: any) {
      console.error('Error removing photo:', err);
      toast.error('Failed to remove profile picture.');
    }
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80 w-full">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative group cursor-pointer hover:opacity-90 transition-all focus:outline-none">
            <Avatar className="h-24 w-24 border-4 border-slate-50 dark:border-slate-900 shadow-md">
              {avatar && <AvatarImage src={avatar} alt={name} />}
              <AvatarFallback className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-3xl font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 p-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-md border-2 border-white dark:border-slate-900 transition-all scale-95">
              <Camera className="h-3.5 w-3.5" />
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-900"
          >
            <Upload className="h-4 w-4" />
            Upload New Photo
          </DropdownMenuItem>
          {avatar && (
            <DropdownMenuItem
              onClick={handleRemovePhoto}
              className="flex items-center gap-2 font-medium text-red-500 hover:text-red-600 dark:hover:bg-red-950/30 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Remove Current Photo
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="space-y-1 text-center sm:text-left">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h3>
        <p className="text-sm font-semibold text-slate-500">{role}</p>
      </div>
    </div>
  );
}
