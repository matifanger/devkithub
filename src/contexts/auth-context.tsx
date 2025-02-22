import React, { createContext, useContext, useState, useEffect } from 'react';

declare global {
  interface Window {
    electron: {
      store: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
        delete: (key: string) => Promise<boolean>;
      };
    };
  }
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure storage key
const SECURE_KEY = 'electron-app-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      // const response = await fetch(`http://localhost:3000/api/verify-api-key`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ key }),
      // });
      return true;
      // return response.status === 200;
    } catch (error) {
      console.error('API validation failed:', error);
      return false;
    }
  };

  useEffect(() => {
    // Check secure storage on load
    const checkAuth = async () => {
      try {
        const storedKey = await window.electron.store.get(SECURE_KEY);
        if (storedKey) {
          const isValid = await validateApiKey(storedKey);
          setIsAuthenticated(isValid);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
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
    const isValid = await validateApiKey(key);
    if (isValid) {
      setIsAuthenticated(true);
      // Store API key securely
      await window.electron.store.set(SECURE_KEY, key);
      return true;
    }
    return false;
  };

  const logout = async () => {
    setIsAuthenticated(false);
    await window.electron.store.delete(SECURE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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