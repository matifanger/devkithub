import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivateLicenseResponse } from '../types/types';

interface AuthContextType {
  isAuthenticated: boolean;
  userData: ActivateLicenseResponse | null;
  login: (key: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure storage key
const SECURE_KEY = 'electron-app-auth';

const ERROR_MESSAGES = {
  INVALID_LICENSE_KEY: 'The license key you entered is not valid.',
  LICENSE_ALREADY_ACTIVATED:
    'This license key has already been activated on another device. If you want to use this license on another device, please contact support.',
  INVALID_INSTANCE_ID: 'Invalid device identifier. Please contact support.',
  FAILED_TO_CREATE_LICENSE_IN_DATABASE:
    'Server error while activating license. Please try again later.',
  NETWORK_ERROR: 'Unable to connect to the license server. Please check your internet connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again later.',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<ActivateLicenseResponse | null>(null);

  // Execute logout
  // useEffect(() => {
  //   const logout = async () => {
  //     await window.electron.store.delete(SECURE_KEY);
  //   };
  //   logout();
  // }, []);

  const getHwid = async (): Promise<string> => {
    try {
      if (window.electron && window.electron.getSimpleHwid) {
        const rawId = await window.electron.getSimpleHwid();
        console.log('Raw ID from main:', rawId);
        const hash = await window.cryptoAPI.hash('md5', rawId);
        console.log('Hashed HWID:', `HWID-${hash}`);

        return `HWID-${hash}`;
      }
      console.log('Falling back to random HWID');
      return generateFallbackHwid();
    } catch (error) {
      console.error('Simple HWID generation failed:', error);
      return generateFallbackHwid();
    }
  };

  const generateFallbackHwid = (): string => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.log('Generated fallback HWID:', `HWID-${randomPart}`);
    return `HWID-${randomPart}`;
  };

  const validateApiKey = async (
    key: string
  ): Promise<{ data: ActivateLicenseResponse | null; message?: string }> => {
    try {
      const baseApi = await window.electron.env.get('BASE_API');
      const response = await fetch(`${baseApi}/api/activate-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseKey: key, hwid: await getHwid() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        const errorMessage =
          ERROR_MESSAGES[errorData?.message as keyof typeof ERROR_MESSAGES] ||
          ERROR_MESSAGES.UNKNOWN_ERROR;
        console.error('API request failed:', errorMessage);
        return { data: null, message: errorMessage };
      }

      const data: ActivateLicenseResponse = await response.json();

      if (data.valid) {
        console.log('License is valid');
        return { data };
      } else {
        console.log('License is invalid');
        return { data: null, message: ERROR_MESSAGES.INVALID_LICENSE_KEY };
      }
    } catch (error) {
      console.error('API validation failed:', error);
      return { data: null, message: ERROR_MESSAGES.NETWORK_ERROR };
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedData = await window.electron.store.get(SECURE_KEY);

        console.warn('storedData', storedData);
        // Load as json
        const storedDataJson = JSON.parse(storedData) as ActivateLicenseResponse;
        if (!storedDataJson) {
          setIsAuthenticated(false);
          setUserData(null);
          return;
        }

        console.warn('storedData.license.license_key', storedDataJson.license.license_key);
        const { data } = await validateApiKey(storedDataJson.license.license_key);
        if (data) {
          setIsAuthenticated(true);
          setUserData(data);
        } else {
          setIsAuthenticated(false);
          setUserData(null);
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
    const { data, message } = await validateApiKey(key);
    if (data) {
      setIsAuthenticated(true);
      setUserData(data);
      // Store API key securely with the new structure
      await window.electron.store.set(SECURE_KEY, JSON.stringify(data));
      return { success: true };
    }
    return { success: false, message };
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
