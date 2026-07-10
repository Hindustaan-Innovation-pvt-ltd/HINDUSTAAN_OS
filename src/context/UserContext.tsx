import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';

interface UserState {
  name: string;
  role: string;
  avatar: string | null;
  department: string;
  email: string;
}

interface UserContextType {
  user: UserState | null;
  updateUser: (updates: Partial<UserState>) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  updateUser: () => {}
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);

  useEffect(() => {
    // Initialize user from auth and localStorage
    const authUser = getCurrentUser();
    
    // We allow setting a default user even if authUser is missing to avoid crashes in some components during demo.
    const defaultRole = authUser?.role || 'employee';
    const defaultName = authUser?.name || (defaultRole === 'manager' ? 'Aakash Gupta' : 'Tanvy Pandey');
    const defaultEmail = authUser?.email || (defaultRole === 'manager' ? 'manager@hindustaan.in' : 'employee@hindustaan.in');

    const emailKey = defaultEmail.toLowerCase();
    const storedAvatar = localStorage.getItem(`userAvatar_${emailKey}`);
    const storedName = localStorage.getItem('userName');
    const storedDepartment = localStorage.getItem('userDepartment');
    const storedRole = localStorage.getItem('userRole');

    setUser({
      name: storedName || defaultName,
      role: storedRole || defaultRole,
      avatar: storedAvatar,
      department: storedDepartment || authUser?.department || 'Engineering',
      email: defaultEmail
    });

    const handleAvatarUpdate = () => {
      setUser(prev => prev ? { ...prev, avatar: localStorage.getItem(`userAvatar_${prev.email.toLowerCase()}`) } : null);
    };
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate);
  }, []);

  const updateUser = (updates: Partial<UserState>) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      
      if (updates.name !== undefined) localStorage.setItem('userName', updates.name);
      if (updates.department !== undefined) localStorage.setItem('userDepartment', updates.department);
      if (updates.role !== undefined) localStorage.setItem('userRole', updates.role);
      const emailKey = prev.email.toLowerCase();
      if (updates.avatar !== undefined && updates.avatar !== null) localStorage.setItem(`userAvatar_${emailKey}`, updates.avatar);
      
      return next;
    });
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
