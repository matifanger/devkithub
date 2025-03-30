import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivateLicenseResponse } from '../types/types';

interface AuthContextType {
  isAuthenticated: boolean;
  userData: ActivateLicenseResponse | null;
  login: (key: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  validateStoredLicense: () => Promise<{ success: boolean; message?: string }>;
  needsValidation: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure storage key
const SECURE_KEY = 'electron-app-auth';
// Key for storing the last validation timestamp
const LAST_VALIDATED_KEY = 'last-license-validation';
// Validation interval in milliseconds (30 days)
const VALIDATION_INTERVAL = 30 * 24 * 60 * 60 * 1000;

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
  const [needsValidation, setNeedsValidation] = useState(false);

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
        // Store the current timestamp as the last validation time
        await window.electron.store.set(LAST_VALIDATED_KEY, Date.now().toString());
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

  // Check if validation is needed based on the last validation timestamp
  const isValidationNeeded = async (): Promise<boolean> => {
    try {
      const lastValidatedStr = await window.electron.store.get(LAST_VALIDATED_KEY);
      if (!lastValidatedStr) {
        return true; // No validation timestamp found, validation needed
      }

      const lastValidated = parseInt(lastValidatedStr, 10);
      const now = Date.now();
      const timeSinceLastValidation = now - lastValidated;

      return timeSinceLastValidation >= VALIDATION_INTERVAL;
    } catch (error) {
      console.error('Error checking validation time:', error);
      return true; // On error, validate to be safe
    }
  };

  // Method to validate stored license
  const validateStoredLicense = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const storedData = await window.electron.store.get(SECURE_KEY);
      if (!storedData) {
        return { success: false, message: 'No license data found' };
      }

      const storedDataJson = JSON.parse(storedData) as ActivateLicenseResponse;
      if (!storedDataJson || !storedDataJson.license?.license_key) {
        return { success: false, message: 'Invalid license data' };
      }

      const { data, message } = await validateApiKey(storedDataJson.license.license_key);
      if (data) {
        setIsAuthenticated(true);
        setUserData(data);
        setNeedsValidation(false);
        // Store updated data
        await window.electron.store.set(SECURE_KEY, JSON.stringify(data));
        return { success: true };
      }

      return { success: false, message };
    } catch (error) {
      console.error('License validation failed:', error);
      return { success: false, message: ERROR_MESSAGES.NETWORK_ERROR };
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedData = await window.electron.store.get(SECURE_KEY);

        console.warn('storedData', storedData);
        // If no stored data, user is not authenticated
        if (!storedData) {
          setIsAuthenticated(false);
          setUserData(null);
          setIsLoading(false);
          return;
        }

        // Load as json
        const storedDataJson = JSON.parse(storedData) as ActivateLicenseResponse;
        if (!storedDataJson) {
          setIsAuthenticated(false);
          setUserData(null);
          setIsLoading(false);
          return;
        }

        console.warn('storedData.license.license_key', storedDataJson.license.license_key);

        // Check if validation is needed based on time elapsed
        const shouldValidate = await isValidationNeeded();

        if (shouldValidate) {
          try {
            // First try to validate with the API
            const { data } = await validateApiKey(storedDataJson.license.license_key);
            if (data) {
              setIsAuthenticated(true);
              setUserData(data);
              setNeedsValidation(false);
              // Update stored data with latest from server
              await window.electron.store.set(SECURE_KEY, JSON.stringify(data));
            } else {
              // If validation fails but we have stored data, keep user authenticated
              // but indicate validation is needed
              setIsAuthenticated(true);
              setUserData(storedDataJson);
              setNeedsValidation(true);
            }
          } catch (error) {
            // Network error or other issue - keep user authenticated but indicate validation needed
            console.error('API validation failed:', error);
            setIsAuthenticated(true);
            setUserData(storedDataJson);
            setNeedsValidation(true);
          }
        } else {
          // Skip validation and use stored data
          console.log('Using cached license data - validation not needed yet');
          setIsAuthenticated(true);
          setUserData(storedDataJson);
          setNeedsValidation(false);
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
      setNeedsValidation(false);
      // Store API key securely with the new structure
      await window.electron.store.set(SECURE_KEY, JSON.stringify(data));
      return { success: true };
    }
    return { success: false, message };
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUserData(null);
    setNeedsValidation(false);
    await window.electron.store.delete(SECURE_KEY);
    await window.electron.store.delete(LAST_VALIDATED_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userData,
        login,
        logout,
        validateStoredLicense,
        needsValidation,
      }}
    >
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
