import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserData {
  name: string;
  email: string;
  license: {
    type: string;
    expires: string;
    key: string;
  };
}

interface StoredData extends UserData {
  key: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userData: UserData | null;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure storage key
const SECURE_KEY = 'electron-app-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  const validateApiKey = async (key: string) => {
    try {
      // const response = await fetch(`http://localhost:3000/api/verify-api-key`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ key }),
      // });

      return {
        name: 'matifanger',
        email: 'matifanger@outlook.com',
        license: {
          type: 'normal',
          expires: '2026-02-22',
          key: '0MAKISH509AHK1HJKHAS05J',
        },
      };
    } catch (error) {
      console.error('API validation failed:', error);
      return error;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedData = await window.electron.store.get(SECURE_KEY);
        if (storedData) {
          const data = JSON.parse(storedData);
          const userData = await validateApiKey(data.license.key);
          if (userData) {
            setIsAuthenticated(true);
            setUserData(userData);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return null; // or a loading spinner
  }

  const login = async (key: string) => {
    const userData = await validateApiKey(key);
    if (userData) {
      setIsAuthenticated(true);
      setUserData(userData);
      // Store API key securely with the new structure
      await window.electron.store.set(SECURE_KEY, JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUserData(null);
    await window.electron.store.delete(SECURE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
