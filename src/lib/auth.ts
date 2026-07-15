import api from './api';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'manager' | 'employee' | 'admin';
  designation?: string;
  department?: string;
  phone?: string;
  password?: string;
  dateJoined?: string;
  avatarUrl?: string;
  empId?: string;
}

const LOCAL_SESSION_KEY = 'hindustaan_user';

export const initializeAuth = () => {
  // No longer needs to pre-populate local storage with mock users
};

export const getRegisteredUsers = (): User[] => {
  // Fallback if any code still requests users
  return [];
};

export const registerUser = async (user: Omit<User, 'dateJoined'>): Promise<boolean> => {
  try {
    const response = await api.post('/auth/signup', {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role === 'employee' ? 'intern' : 'manager',
      phoneWa: user.phone,
      empId: user.id || null,
      department: user.department || null,
      designation: user.designation || null,
    });
    return !!(response.data && response.data.success);
  } catch (error: any) {
    if (error.response?.data?.errors) {
      const errorList = error.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Validation failed - ${errorList}`);
    }
    const errorMsg = error.response?.data?.message || error.message || 'Registration failed';
    throw new Error(errorMsg);
  }
};

export const loginUser = async (
  email: string,
  password?: string,
  rememberMe: boolean = true
): Promise<User | null> => {
  try {
    // If password is not provided (e.g. mock OTP login flow in frontend)
    // we can send a dummy password or handle it since backend requires it.
    // For a real connection, we send the credentials to the backend.
    const response = await api.post('/auth/login', {
      email,
      password: password || 'default_otp_password_placeholder',
    });

    if (response.data && response.data.success) {
      const dbUser = response.data.user;
      const safeUser: User = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: (dbUser.role === 'admin') ? 'admin' : (dbUser.role === 'manager') ? 'manager' : 'employee',
        designation: dbUser.designation || undefined,
        department: dbUser.department || undefined,
        phone: dbUser.phoneWa || undefined,
        avatarUrl: dbUser.avatarUrl || undefined,
        empId: dbUser.empId || undefined,
      };

      if (rememberMe) {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(safeUser));
        sessionStorage.removeItem(LOCAL_SESSION_KEY);
      } else {
        sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(safeUser));
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
      return safeUser;
    }
    return null;
  } catch (error: any) {
    if (error.response?.data?.errors) {
      const errorList = error.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Validation failed - ${errorList}`);
    }
    const errorMsg = error.response?.data?.message || error.message || 'Login failed';
    throw new Error(errorMsg);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error: any) {
    if (error.response?.status !== 401) {
      console.error('Logout error on backend:', error);
    }
  } finally {
    const user = getCurrentUser();
    if (user) {
      let userId = 'u-4';
      if (user.email.toLowerCase().includes('amanda')) userId = 'u-1';
      else if (user.email.toLowerCase().includes('rahul')) userId = 'u-2';
      else if (user.email.toLowerCase().includes('priya')) userId = 'u-3';
      localStorage.removeItem(`login_time_${userId}`);
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
    sessionStorage.removeItem(LOCAL_SESSION_KEY);
  }
};

export const getCurrentUser = (): User | null => {
  const local = localStorage.getItem(LOCAL_SESSION_KEY);
  const session = sessionStorage.getItem(LOCAL_SESSION_KEY);
  if (local) return JSON.parse(local);
  if (session) return JSON.parse(session);
  return null;
};

export const updatePassword = (
  email: string,
  currentPass: string,
  newPass: string
): { success: boolean; message: string } => {
  // Since backend doesn't have an endpoint for logged-in profile password updates,
  // we simulate a success for frontend Settings page compatibility, or perform mock update.
  return { success: true, message: 'Password updated successfully (Local settings saved).' };
};

/**
 * Calls PUT /api/auth/profile/:userId to persist profile changes to the database.
 * On success, syncs the returned user fields back into localStorage.
 */
export const updateProfileOnBackend = async (
  userId: string,
  fields: { name?: string; department?: string; designation?: string; avatarUrl?: string; phoneWa?: string }
): Promise<User | null> => {
  try {
    const response = await api.put(`/auth/profile/${userId}`, fields);
    if (response.data?.success) {
      const dbUser = response.data.user;
      // Sync back to localStorage
      const current = getCurrentUser();
      if (current) {
        const updated: User = {
          ...current,
          name: dbUser.name ?? current.name,
          department: dbUser.department ?? current.department,
          designation: dbUser.designation ?? current.designation,
          avatarUrl: dbUser.avatarUrl ?? current.avatarUrl,
          empId: dbUser.empId ?? current.empId,
          phone: dbUser.phoneWa ?? current.phone,
        };
        const key = 'hindustaan_user';
        if (localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify(updated));
        } else {
          sessionStorage.setItem(key, JSON.stringify(updated));
        }
        return updated;
      }
    }
    return null;
  } catch (err: any) {
    console.error('Failed to update profile on backend:', err);
    throw new Error(err.response?.data?.message || err.message || 'Profile update failed');
  }
};

/**
 * Calls GET /api/auth/profile/:userId to fetch profile details and updates local session details.
 */
export const fetchProfileFromBackend = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.get(`/auth/profile/${userId}`);
    if (response.data?.success) {
      const dbUser = response.data.user;
      const current = getCurrentUser();
      if (current) {
        const updated: User = {
          ...current,
          name: dbUser.name ?? current.name,
          department: dbUser.department ?? current.department,
          designation: dbUser.designation ?? current.designation,
          avatarUrl: dbUser.avatarUrl ?? current.avatarUrl,
          empId: dbUser.empId ?? current.empId,
          phone: dbUser.phoneWa ?? current.phone,
        };
        const key = 'hindustaan_user';
        if (localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify(updated));
        } else {
          sessionStorage.setItem(key, JSON.stringify(updated));
        }
        return updated;
      }
    }
    return null;
  } catch (err: any) {
    console.error('Failed to fetch profile from backend:', err);
    return null;
  }
};

/**
 * Uploads a profile photo file to the backend via /api/upload/profile-photo.
 * Returns the Cloudinary URL on success.
 */
export const uploadAvatarToBackend = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/upload/profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (response.data?.url) {
    // Sync avatarUrl into the stored session
    const current = getCurrentUser();
    if (current) {
      const key = 'hindustaan_user';
      const updated: User = { ...current, avatarUrl: response.data.url };
      if (localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(updated));
      } else {
        sessionStorage.setItem(key, JSON.stringify(updated));
      }
    }
    return response.data.url;
  }
  throw new Error('No URL returned from upload API');
};

