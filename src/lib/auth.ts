export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'manager' | 'employee';
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
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    const demoUsers: User[] = [
      {
        id: 'MGR001',
        name: 'Aakash Gupta',
        email: 'manager1@hindustaan.in',
        password: 'Manager@123',
        role: 'manager',
        department: 'Engineering',
        dateJoined: new Date().toISOString()
      },
      {
        id: 'EMP001',
        name: 'Tanvy Pandey',
        email: 'employee1@hindustaan.in',
        password: 'Employee@123',
        role: 'employee',
        department: 'Engineering',
        dateJoined: new Date().toISOString()
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
  }
};

export const getRegisteredUsers = (): User[] => {
  const usersStr = localStorage.getItem(USERS_KEY);
  return usersStr ? JSON.parse(usersStr) : [];
};

export const registerUser = (user: Omit<User, 'dateJoined'>): boolean => {
  const users = getRegisteredUsers();
  if (users.find(u => u.email === user.email)) {
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
  const user = users.find(u => u.email === email && (!password || u.password === password));
  
  if (user) {
    const safeUser = { name: user.name, email: user.email, role: user.role, id: user.id, department: user.department };
    if (rememberMe) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(safeUser));
    } else {
      sessionStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(safeUser));
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
    return safeUser;
  }
  return null;
};

export const logoutUser = () => {
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
