import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/auth-context';
import { loadThemePreferences } from '../utils/profile/settings-utils';
import { getSelectedThemeObject } from '../utils/profile/theme-utils';
import { applyTheme } from '../utils/themes';

export function LoginPage() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('purple-default');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { setTheme, theme: themeMode } = useTheme();

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { selectedTheme, customThemes, themeMode: savedMode } = await loadThemePreferences();

        if (savedMode) {
          setTheme(savedMode);
        }

        let themeObj = getSelectedThemeObject(selectedTheme, customThemes);

        // Fallback to purple-default if theme not found
        if (!themeObj) {
          themeObj = getSelectedThemeObject('purple-default', customThemes);
          setCurrentTheme('purple-default');
        } else {
          setCurrentTheme(selectedTheme);
        }

        if (themeObj) {
          const mode = savedMode || 'light';
          applyTheme(themeObj, mode);
        }
      } catch {
        // Fallback to purple on any error
        setTheme('light');
        setCurrentTheme('purple-default');
      }
    };
    loadTheme();
  }, [setTheme]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { success, message } = await login(key);
      if (success) {
        navigate('/');
      } else {
        setError(message || 'Invalid API key');
      }
    } catch (err) {
      setError('Failed to validate API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setKey(e.target.value);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Welcome to DevKitHub</h1>
          {/* <p className="text-muted-foreground text-sm">Theme: {currentTheme}</p> */}
          <p className="text-muted-foreground">Enter your API key to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">API Key</Label>
            <Input
              id="key"
              type="text"
              value={key}
              onChange={handleKeyChange}
              placeholder="Enter your API key"
              disabled={isLoading}
              onClick={() => setError('')}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-sm">
              Don't have an API key?{' '}
              <button
                className="text-primary"
                onClick={() => window.electron.openExternal('https://devkithub.com')}
              >
                Buy it here
              </button>
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Validating...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
