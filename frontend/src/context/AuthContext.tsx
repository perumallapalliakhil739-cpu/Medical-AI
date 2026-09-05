import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { login as apiLogin, getCurrentUser, setAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setRole: (role: UserRole) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'demo-clinician',
    email: 'dr.watson@medlens.org',
    name: 'Dr. Elena Watson, MD',
    role: 'clinician',
    account_status: 'active',
    institution: 'Metropolitan Clinical Center',
    license_number: 'MD-88421'
  });
  const [role, setRoleState] = useState<UserRole>('clinician');
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Attempt background login with demo clinician credentials to acquire live JWT token
    const initAuth = async () => {
      try {
        if (!getAuthToken()) {
          const authRes = await apiLogin('dr.watson@medlens.org', 'MedLens2026!');
          setUser(authRes.user);
          setRoleState(authRes.user.role as UserRole);
          setTokenState(authRes.access_token);
        } else {
          const profile = await getCurrentUser();
          setUser(profile);
          setRoleState(profile.role as UserRole);
        }
      } catch (err) {
        // Fallback to offline demo user persona
        console.warn('Backend auth unreachable or in offline mode, operating with clinical demo profile.');
      }
    };
    initAuth();
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const authRes = await apiLogin(email, pass);
      setUser(authRes.user);
      setRoleState(authRes.user.role as UserRole);
      setTokenState(authRes.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user,
        isLoading,
        setRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
