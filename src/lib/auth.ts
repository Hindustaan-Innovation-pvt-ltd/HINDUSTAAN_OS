export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'manager' | 'employee' | 'admin';
  designation?: string;
  department?: string;
  phone?: string;
  password?: string; // Only stored locally for mock
  dateJoined?: string;
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
      dateJoined: new Date().toISOString()
    },
    {
      id: 'EMP001',
      name: 'Tanvy Pandey',
      email: 'employee1@hindustaan.in',
      password: 'Employee@123',
      role: 'employee',
      designation: 'Frontend Developer',
      department: 'Engineering',
      dateJoined: new Date().toISOString()
    },
    {
      id: 'ADM001',
      name: 'System Admin',
      email: 'admin@hindustaan.in',
      password: 'Admin@123',
      role: 'admin',
      designation: 'System Administrator',
      department: 'IT',
      dateJoined: new Date().toISOString()
    }
  ];

  let updated = false;
  demoUsers.forEach(demoUser => {
    if (!users.find(u => u.email === demoUser.email)) {
      users.push(demoUser);
      updated = true;
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

export const registerUser = (user: Omit<User, 'dateJoined'>): boolean => {
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
  return true;
};

export const loginUser = (email: string, password?: string, rememberMe: boolean = true): User | null => {
  const users = getRegisteredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (!password || u.password === password));
  
  if (user) {
    const accessToken = `mock-token-${Date.now()}`;
    const safeUser = { name: user.name, email: user.email, role: user.role, id: user.id, department: user.department, designation: user.designation, phone: user.phone, accessToken, userId: user.id };
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(safeUser));
    sessionStorage.removeItem(LOCAL_SESSION_KEY);
    return safeUser;
  }
  return null;
};

export const logoutUser = () => {
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
