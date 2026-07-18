import type { User } from './auth';

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  department: string;
  role: string;
  avatar: string;
  
  // Professional Information
  manager: string;
  employmentType: 'Intern' | 'Employee' | 'Admin';
  team: string;
  joiningDate: string;
  endDate: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  officeLocation: string;
  
  // Skills
  skills: string[];
  
  // About & Emergency
  aboutMe: string;
  emergencyContact: string;
  
  // Social Links
  github: string;
  linkedin: string;
  portfolio: string;
  
  // Account Information
  accountCreated: string;
  lastLogin: string;
  emailVerified: boolean;
}

const PROFILE_KEY_PREFIX = 'hindustaan_profile_';

export const getProfileData = (user: User): ProfileData => {
  const key = PROFILE_KEY_PREFIX + user.email.toLowerCase();
  const saved = localStorage.getItem(key);
  const localData: Partial<ProfileData> = {};

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        Object.assign(localData, parsed);
      }
    } catch (e) {
      console.error('Error parsing profile data, resetting to default', e);
    }
  }

  const defaultProfile = createDefaultProfile(user);

  // Backend-sourced fields override the default — use what came from login session
  const merged: ProfileData = {
    ...defaultProfile,
    ...localData,
    // Always trust backend-sourced fields from the stored session
    name: user.name || defaultProfile.name,
    email: user.email,
    department: user.department || localData.department || defaultProfile.department,
    employeeId: user.empId || localData.employeeId || defaultProfile.employeeId,
    role: user.role === 'manager' ? 'Manager' : user.role === 'admin' ? 'Administrator' : (localData.role || defaultProfile.role),
    // avatarUrl from backend takes priority over locally-stored base64
    avatar: user.avatarUrl || localData.avatar || defaultProfile.avatar,
    phone: user.phone || localData.phone || defaultProfile.phone,
  };

  return merged;
};

export const saveProfileData = (email: string, data: ProfileData) => {
  const key = PROFILE_KEY_PREFIX + email.toLowerCase();
  localStorage.setItem(key, JSON.stringify(data));
};

const createDefaultProfile = (user: User): ProfileData => {
  const joining = user.dateJoined ? new Date(user.dateJoined) : new Date();
  const end = new Date(joining);
  end.setMonth(joining.getMonth() + 6); // default 6 month internship/contract

  return {
    name: user.name || 'Hindustaan User',
    email: user.email,
    phone: user.phone || '',
    employeeId: user.id || `EMP${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    department: user.department || 'Engineering',
    role: user.role === 'manager' ? 'Manager' : 'Frontend Developer',
    avatar: localStorage.getItem(`userAvatar_${user.email.toLowerCase()}`) || '',
    manager: user.role === 'manager' ? 'VP of Engineering' : 'Aakash Gupta',
    employmentType: user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Employee' : 'Intern',
    team: user.department ? `${user.department} Team` : 'Core Engineering',
    joiningDate: joining.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    endDate: end.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    workMode: 'Hybrid',
    officeLocation: 'Bengaluru, India',
    skills: [],
    aboutMe: '',
    emergencyContact: '',
    github: '',
    linkedin: '',
    portfolio: '',
    accountCreated: joining.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    lastLogin: new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    emailVerified: true
  };
};
