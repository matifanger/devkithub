import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { UPDATE_THEME_KEY } from '../../constants/settings-keys';

import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface ThemeToggleProps {
  label?: string;
}

export function ThemeToggle({ label }: ThemeToggleProps = {}) {
  const { setTheme, theme } = useTheme();

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    await window.electron.settingsStore.set(UPDATE_THEME_KEY, newTheme);
  };

  React.useEffect(() => {
    const loadSavedTheme = async () => {
      const savedTheme = await window.electron.settingsStore.get(UPDATE_THEME_KEY);
      if (savedTheme) {
        setTheme(savedTheme);
      }
    };
    loadSavedTheme();
  }, [setTheme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={label ? 'default' : 'icon'}
          className="flex items-center gap-2"
        >
          <div className="flex items-center justify-center w-4 h-4">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </div>
          {label && <span>{label}</span>}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
