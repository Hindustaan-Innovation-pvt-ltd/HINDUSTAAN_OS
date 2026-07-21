import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';

interface UserState {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  department: string;
  email: string;
}

interface UserContextType {
  user: UserState | null;
  loading: boolean;
  updateUser: (updates: Partial<UserState>) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  updateUser: () => { }
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // We use our new /api/auth/me endpoint to enforce JWT flow
        const api = (await import('@/lib/api')).default;
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data.data) {
          const profile = res.data.data;
          setUser({
            id: profile.id,
            name: profile.name,
            role: profile.role,
            avatar: profile.avatarUrl || null,
            department: profile.department || 'Engineering',
            email: profile.email
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Failed to fetch user from /api/auth/me:', err);
        // Fallback for mock if needed, but we aim to rely strictly on backend
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    const handleAvatarUpdate = () => {
      // Intentionally left blank, we rely on updateUser calls directly or session updates
    };
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate);
  }, []);

  const updateUser = (updates: Partial<UserState>) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      const emailKey = prev.email.toLowerCase();

      if (updates.name !== undefined) localStorage.setItem(`userName_${emailKey}`, updates.name);
      if (updates.department !== undefined) localStorage.setItem(`userDepartment_${emailKey}`, updates.department);
      if (updates.role !== undefined) localStorage.setItem(`userRole_${emailKey}`, updates.role);

      return next;
    });
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
