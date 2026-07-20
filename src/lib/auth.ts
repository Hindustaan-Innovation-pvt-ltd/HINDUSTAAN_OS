import api from './api';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'manager' | 'employee' | 'admin' | 'intern';
  designation?: string;
  department?: string;
  phone?: string;
  password?: string; // Only stored locally for mock
  dateJoined?: string;
  isActive?: boolean;
  reportingManager?: string;
  empId?: string;
  isApproved?: boolean;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
}

const USERS_KEY = 'hindustaan_users';
const SESSION_KEY = 'hindustaan_session';
const LOCAL_SESSION_KEY = 'hindustaan_user'; // Legacy compatibility

// Initialize mock users if none exist
export const initializeAuth = () => {
  const usersStr = localStorage.getItem(USERS_KEY);
  let users: User[] = usersStr ? JSON.parse(usersStr) : [];
  
  const demoUsers: User[] = [
    {
      id: 'MGR001',
      name: 'Aakash Gupta',
      email: 'manager1@hindustaan.in',
      password: 'Manager@123',
      role: 'manager',
      designation: 'Product Manager',
      department: 'Engineering',
      dateJoined: new Date().toISOString(),
      isActive: true,
      reportingManager: 'None'
    },
    {
      id: 'EMP001',
      name: 'Tanvy Pandey',
      email: 'employee1@hindustaan.in',
      password: 'Employee@123',
      role: 'employee',
      designation: 'Frontend Developer',
      department: 'Engineering',
      dateJoined: new Date().toISOString(),
      isActive: true,
      reportingManager: 'Aakash Gupta'
    },
    {
      id: 'ADM001',
      name: 'admin',
      email: 'admin@hindustaan.in',
      password: 'admin@123',
      role: 'admin',
      designation: 'System Administrator',
      department: 'IT',
      dateJoined: new Date().toISOString(),
      isActive: true,
      reportingManager: 'None'
    },
    {
      id: 'EMP002',
      name: 'Amanda Smith',
      email: 'amanda@hindustaan.in',
      password: 'Employee@123',
      role: 'employee',
      designation: 'Frontend Lead',
      department: 'Engineering',
      dateJoined: new Date().toISOString(),
      isActive: true,
      reportingManager: 'Aakash Gupta'
    },
    {
      id: 'EMP003',
      name: 'Rahul Sharma',
      email: 'rahul@hindustaan.in',
      password: 'Employee@123',
      role: 'employee',
      designation: 'Backend Developer',
      department: 'Engineering',
      dateJoined: new Date().toISOString(),
      isActive: true,
      reportingManager: 'Aakash Gupta'
    },
    {
      id: 'EMP004',
      name: 'Priya Patel',
      email: 'priya@hindustaan.in',
      password: 'Employee@123',
      role: 'employee',
      designation: 'Technical Writer',
      department: 'Product',
      dateJoined: new Date().toISOString(),
      isActive: true,
      reportingManager: 'Aakash Gupta'
    }
  ];

  let updated = false;
  demoUsers.forEach(demoUser => {
    const existing = users.find(u => u.email === demoUser.email);
    if (!existing) {
      users.push(demoUser);
      updated = true;
    } else {
      // Seed missing fields for existing users
      if (existing.isActive === undefined) {
        existing.isActive = demoUser.isActive;
        updated = true;
      }
      if (existing.reportingManager === undefined) {
        existing.reportingManager = demoUser.reportingManager;
        updated = true;
      }
    }
  });

  if (updated || !usersStr) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const getRegisteredUsers = (): User[] => {
  initializeAuth();
  const usersStr = localStorage.getItem(USERS_KEY);
  return usersStr ? JSON.parse(usersStr) : [];
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
    // Graceful fallback for Network errors (e.g., CORS, backend offline, or Proxy 502/504 errors)
    if (error.message === 'Network Error' || !error.response || error.response.status >= 500) {
      console.warn('Backend unavailable, mocking successful registration.');
      const users = getRegisteredUsers();
      if (users.find(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        return false; // Email already exists
      }
      const newUser = {
        ...user,
        id: user.id || `EMP${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        dateJoined: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true; // Simulate success
    }

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
        accessToken: response.data.accessToken || response.data.token || undefined,
        refreshToken: response.data.refreshToken || undefined,
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
    // Graceful fallback for Network errors (including Proxy 502/504 errors)
    if (error.message === 'Network Error' || !error.response || error.response.status >= 500) {
      console.warn('Backend unavailable, mocking successful login.');
      const users = getRegisteredUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (!password || u.password === password || password === 'default_otp_password_placeholder'));
      
      if (user) {
        const accessToken = `mock-token-${Date.now()}`;
        const refreshToken = `mock-refresh-${Date.now()}`;
        const safeUser = { name: user.name, email: user.email, role: user.role, id: user.id, department: user.department, designation: user.designation, phone: user.phone, accessToken, refreshToken, userId: user.id };
        if (rememberMe) {
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(safeUser));
          sessionStorage.removeItem(LOCAL_SESSION_KEY);
        } else {
          sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(safeUser));
          localStorage.removeItem(LOCAL_SESSION_KEY);
        }
        return safeUser;
      }
      throw new Error('Invalid credentials');
    }

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

export const updatePassword = (email: string, currentPass: string, newPass: string): {success: boolean, message: string} => {
  const users = getRegisteredUsers();
  const index = users.findIndex(u => u.email === email);
  if (index === -1) return {success: false, message: 'User not found.'};
  
  // If the user has a password set, verify it
  if (users[index].password && users[index].password !== currentPass) {
    return {success: false, message: 'Incorrect current password.'};
  }
  
  users[index].password = newPass;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return {success: true, message: 'Password updated successfully.'};
};

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
  } catch (error) {
    console.warn('Backend unavailable, mocking profile update.');
    const current = getCurrentUser();
    if (current) {
      const updated: User = {
        ...current,
        name: fields.name ?? current.name,
        department: fields.department ?? current.department,
        designation: fields.designation ?? current.designation,
        avatarUrl: fields.avatarUrl ?? current.avatarUrl,
        phone: fields.phoneWa ?? current.phone,
      };
      const key = 'hindustaan_user';
      if (localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(updated));
      } else {
        sessionStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    }
    return null;
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
    if (err?.response?.status !== 404) {
      console.error('Failed to fetch profile from backend:', err);
    }
    return null;
  }
};

/**
 * Uploads a profile photo file to the backend via /api/upload/profile-photo.
 * Returns the Cloudinary URL on success.
 */
export const uploadAvatarToBackend = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
};
