export interface Theme {
  name: string;
  id: string;
  cssVariables: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  isCustom?: boolean;
  isEditable?: boolean;
  createdAt?: string;
}

export const predefinedThemes: Theme[] = [
  {
    name: 'Elegant Luxury',
    id: 'elegant-luxury',
    isCustom: false,
    isEditable: false,
    cssVariables: {
      light: {
        '--background': '24 33.3333% 97.0588%',
        '--foreground': '0 0% 10.1961%',
        '--card': '24 33.3333% 97.0588%',
        '--card-foreground': '0 0% 10.1961%',
        '--popover': '24 33.3333% 97.0588%',
        '--popover-foreground': '0 0% 10.1961%',
        '--primary': '0 55.7789% 39.0196%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '43.0769 90.6977% 91.5686%',
        '--secondary-foreground': '39.8438 100% 25.0980%',
        '--muted': '22.5000 21.0526% 92.5490%',
        '--muted-foreground': '33.3333 5.4545% 32.3529%',
        '--accent': '48.0000 96.4912% 88.8235%',
        '--accent-foreground': '0 62.8205% 30.5882%',
        '--destructive': '0 70% 35.2941%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '37.7143 63.6364% 89.2157%',
        '--input': '37.7143 63.6364% 89.2157%',
        '--ring': '0 55.7789% 39.0196%',
        '--chart-1': '0 73.7089% 41.7647%',
        '--chart-2': '0 55.7789% 39.0196%',
        '--chart-3': '0 62.8205% 30.5882%',
        '--chart-4': '25.9649 90.4762% 37.0588%',
        '--chart-5': '22.7273 82.5000% 31.3725%',
        '--radius': '0.375rem',
      },
      dark: {
        '--background': '24 9.8039% 10%',
        '--foreground': '60 4.7619% 95.8824%',
        '--card': '12.0000 6.4935% 15.0980%',
        '--card-foreground': '60 4.7619% 95.8824%',
        '--popover': '12.0000 6.4935% 15.0980%',
        '--popover-foreground': '60 4.7619% 95.8824%',
        '--primary': '0 73.7089% 41.7647%',
        '--primary-foreground': '24 33.3333% 97.0588%',
        '--secondary': '22.7273 82.5000% 31.3725%',
        '--secondary-foreground': '48.0000 96.4912% 88.8235%',
        '--muted': '12.0000 6.4935% 15.0980%',
        '--muted-foreground': '24.0000 5.7471% 82.9412%',
        '--accent': '25.9649 90.4762% 37.0588%',
        '--accent-foreground': '48.0000 96.4912% 88.8235%',
        '--destructive': '0 84.2365% 60.1961%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '30 6.2500% 25.0980%',
        '--input': '30 6.2500% 25.0980%',
        '--ring': '0 73.7089% 41.7647%',
        '--chart-1': '0 90.6040% 70.7843%',
        '--chart-2': '0 84.2365% 60.1961%',
        '--chart-3': '0 72.2222% 50.5882%',
        '--chart-4': '43.2558 96.4126% 56.2745%',
        '--chart-5': '37.6923 92.1260% 50.1961%',
      },
    },
  },
  {
    name: 'Purple',
    id: 'purple-default',
    isCustom: false,
    isEditable: false,
    cssVariables: {
      light: {
        '--background': '253 44% 98%',
        '--foreground': '253 58% 0%',
        '--muted': '253 7% 87%',
        '--muted-foreground': '253 13% 37%',
        '--popover': '253 44% 98%',
        '--popover-foreground': '253 58% 0%',
        '--card': '253 44% 97%',
        '--card-foreground': '0 0% 0%',
        '--border': '220 13% 91%',
        '--input': '220 13% 91%',
        '--primary': '253 91% 58%',
        '--primary-foreground': '253 91% 98%',
        '--secondary': '253 5% 89%',
        '--secondary-foreground': '253 5% 29%',
        '--accent': '253 12% 82%',
        '--accent-foreground': '253 12% 22%',
        '--destructive': '339.2 90.36% 51.18%',
        '--destructive-foreground': '0 0% 100%',
        '--ring': '253 91% 58%',
        '--chart-1': '253 91% 58%',
        '--chart-2': '253 5% 89%',
        '--chart-3': '253 12% 82%',
        '--chart-4': '253 5% 92%',
        '--chart-5': '253 94% 58%',
        '--radius': '0.5rem',
      },
      dark: {
        '--background': '253 43% 3%',
        '--foreground': '253 31% 98%',
        '--muted': '253 7% 13%',
        '--muted-foreground': '253 13% 63%',
        '--popover': '253 43% 3%',
        '--popover-foreground': '253 31% 98%',
        '--card': '253 43% 4%',
        '--card-foreground': '253 31% 99%',
        '--border': '215 27.9% 16.9%',
        '--input': '215 27.9% 16.9%',
        '--primary': '253 91% 58%',
        '--primary-foreground': '253 91% 98%',
        '--secondary': '253 7% 9%',
        '--secondary-foreground': '253 7% 69%',
        '--accent': '253 13% 14%',
        '--accent-foreground': '253 13% 74%',
        '--destructive': '339.2 90.36% 51.18%',
        '--destructive-foreground': '0 0% 100%',
        '--ring': '253 91% 58%',
        '--chart-1': '253 91% 58%',
        '--chart-2': '253 7% 9%',
        '--chart-3': '253 13% 14%',
        '--chart-4': '253 7% 12%',
        '--chart-5': '253 94% 58%',
      },
    },
  },
  {
    name: 'Blue Ocean',
    id: 'blue-ocean',
    isCustom: false,
    isEditable: false,
    cssVariables: {
      light: {
        '--background': '210 40% 98%',
        '--foreground': '222.2 84% 4.9%',
        '--muted': '210 40% 96%',
        '--muted-foreground': '215.4 16.3% 46.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '222.2 84% 4.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '222.2 84% 4.9%',
        '--border': '214.3 31.8% 91.4%',
        '--input': '214.3 31.8% 91.4%',
        '--primary': '217.2 91.2% 59.8%',
        '--primary-foreground': '210 40% 98%',
        '--secondary': '210 40% 96%',
        '--secondary-foreground': '222.2 84% 4.9%',
        '--accent': '210 40% 96%',
        '--accent-foreground': '222.2 84% 4.9%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '210 40% 98%',
        '--ring': '217.2 91.2% 59.8%',
        '--chart-1': '217.2 91.2% 59.8%',
        '--chart-2': '210 40% 96%',
        '--chart-3': '210 40% 90%',
        '--chart-4': '210 40% 85%',
        '--chart-5': '217.2 91.2% 70%',
        '--radius': '0.5rem',
      },
      dark: {
        '--background': '222.2 84% 4.9%',
        '--foreground': '210 40% 98%',
        '--muted': '217.2 32.6% 17.5%',
        '--muted-foreground': '215 20.2% 65.1%',
        '--popover': '222.2 84% 4.9%',
        '--popover-foreground': '210 40% 98%',
        '--card': '222.2 84% 4.9%',
        '--card-foreground': '210 40% 98%',
        '--border': '217.2 32.6% 17.5%',
        '--input': '217.2 32.6% 17.5%',
        '--primary': '217.2 91.2% 59.8%',
        '--primary-foreground': '222.2 84% 4.9%',
        '--secondary': '217.2 32.6% 17.5%',
        '--secondary-foreground': '210 40% 98%',
        '--accent': '217.2 32.6% 17.5%',
        '--accent-foreground': '210 40% 98%',
        '--destructive': '0 62.8% 30.6%',
        '--destructive-foreground': '210 40% 98%',
        '--ring': '217.2 91.2% 59.8%',
        '--chart-1': '217.2 91.2% 59.8%',
        '--chart-2': '217.2 32.6% 17.5%',
        '--chart-3': '217.2 32.6% 25%',
        '--chart-4': '217.2 32.6% 30%',
        '--chart-5': '217.2 91.2% 70%',
      },
    },
  },
  {
    name: 'Green Forest',
    id: 'green-forest',
    isCustom: false,
    isEditable: false,
    cssVariables: {
      light: {
        '--background': '120 40% 98%',
        '--foreground': '120 84% 4.9%',
        '--muted': '120 40% 96%',
        '--muted-foreground': '125 16.3% 46.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '120 84% 4.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '120 84% 4.9%',
        '--border': '124.3 31.8% 91.4%',
        '--input': '124.3 31.8% 91.4%',
        '--primary': '142.1 76.2% 36.3%',
        '--primary-foreground': '120 40% 98%',
        '--secondary': '120 40% 96%',
        '--secondary-foreground': '120 84% 4.9%',
        '--accent': '120 40% 96%',
        '--accent-foreground': '120 84% 4.9%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '120 40% 98%',
        '--ring': '142.1 76.2% 36.3%',
        '--chart-1': '142.1 76.2% 36.3%',
        '--chart-2': '120 40% 96%',
        '--chart-3': '120 40% 90%',
        '--chart-4': '120 40% 85%',
        '--chart-5': '142.1 76.2% 50%',
        '--radius': '0.5rem',
      },
      dark: {
        '--background': '120 84% 4.9%',
        '--foreground': '120 40% 98%',
        '--muted': '127.2 32.6% 17.5%',
        '--muted-foreground': '125 20.2% 65.1%',
        '--popover': '120 84% 4.9%',
        '--popover-foreground': '120 40% 98%',
        '--card': '120 84% 4.9%',
        '--card-foreground': '120 40% 98%',
        '--border': '127.2 32.6% 17.5%',
        '--input': '127.2 32.6% 17.5%',
        '--primary': '142.1 76.2% 36.3%',
        '--primary-foreground': '120 84% 4.9%',
        '--secondary': '127.2 32.6% 17.5%',
        '--secondary-foreground': '120 40% 98%',
        '--accent': '127.2 32.6% 17.5%',
        '--accent-foreground': '120 40% 98%',
        '--destructive': '0 62.8% 30.6%',
        '--destructive-foreground': '120 40% 98%',
        '--ring': '142.1 76.2% 36.3%',
        '--chart-1': '142.1 76.2% 36.3%',
        '--chart-2': '127.2 32.6% 17.5%',
        '--chart-3': '127.2 32.6% 25%',
        '--chart-4': '127.2 32.6% 30%',
        '--chart-5': '142.1 76.2% 50%',
      },
    },
  },
  {
    name: 'Orange Sunset',
    id: 'orange-sunset',
    isCustom: false,
    isEditable: false,
    cssVariables: {
      light: {
        '--background': '30 40% 98%',
        '--foreground': '30 84% 4.9%',
        '--muted': '30 40% 96%',
        '--muted-foreground': '35 16.3% 46.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '30 84% 4.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '30 84% 4.9%',
        '--border': '34.3 31.8% 91.4%',
        '--input': '34.3 31.8% 91.4%',
        '--primary': '24.6 95% 53.1%',
        '--primary-foreground': '30 40% 98%',
        '--secondary': '30 40% 96%',
        '--secondary-foreground': '30 84% 4.9%',
        '--accent': '30 40% 96%',
        '--accent-foreground': '30 84% 4.9%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '30 40% 98%',
        '--ring': '24.6 95% 53.1%',
        '--chart-1': '24.6 95% 53.1%',
        '--chart-2': '30 40% 96%',
        '--chart-3': '30 40% 90%',
        '--chart-4': '30 40% 85%',
        '--chart-5': '24.6 95% 65%',
        '--radius': '0.5rem',
      },
      dark: {
        '--background': '30 84% 4.9%',
        '--foreground': '30 40% 98%',
        '--muted': '37.2 32.6% 17.5%',
        '--muted-foreground': '35 20.2% 65.1%',
        '--popover': '30 84% 4.9%',
        '--popover-foreground': '30 40% 98%',
        '--card': '30 84% 4.9%',
        '--card-foreground': '30 40% 98%',
        '--border': '37.2 32.6% 17.5%',
        '--input': '37.2 32.6% 17.5%',
        '--primary': '24.6 95% 53.1%',
        '--primary-foreground': '30 84% 4.9%',
        '--secondary': '37.2 32.6% 17.5%',
        '--secondary-foreground': '30 40% 98%',
        '--accent': '37.2 32.6% 17.5%',
        '--accent-foreground': '30 40% 98%',
        '--destructive': '0 62.8% 30.6%',
        '--destructive-foreground': '30 40% 98%',
        '--ring': '24.6 95% 53.1%',
        '--chart-1': '24.6 95% 53.1%',
        '--chart-2': '37.2 32.6% 17.5%',
        '--chart-3': '37.2 32.6% 25%',
        '--chart-4': '37.2 32.6% 30%',
        '--chart-5': '24.6 95% 65%',
      },
    },
  },
  {
    name: 'Red Cherry',
    id: 'red-cherry',
    isCustom: false,
    isEditable: false,
    cssVariables: {
      light: {
        '--background': '0 40% 98%',
        '--foreground': '0 84% 4.9%',
        '--muted': '0 40% 96%',
        '--muted-foreground': '5 16.3% 46.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 84% 4.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 84% 4.9%',
        '--border': '4.3 31.8% 91.4%',
        '--input': '4.3 31.8% 91.4%',
        '--primary': '346.8 77.2% 49.8%',
        '--primary-foreground': '0 40% 98%',
        '--secondary': '0 40% 96%',
        '--secondary-foreground': '0 84% 4.9%',
        '--accent': '0 40% 96%',
        '--accent-foreground': '0 84% 4.9%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '0 40% 98%',
        '--ring': '346.8 77.2% 49.8%',
        '--chart-1': '346.8 77.2% 49.8%',
        '--chart-2': '0 40% 96%',
        '--chart-3': '0 40% 90%',
        '--chart-4': '0 40% 85%',
        '--chart-5': '346.8 77.2% 65%',
        '--radius': '0.5rem',
      },
      dark: {
        '--background': '0 84% 4.9%',
        '--foreground': '0 40% 98%',
        '--muted': '7.2 32.6% 17.5%',
        '--muted-foreground': '5 20.2% 65.1%',
        '--popover': '0 84% 4.9%',
        '--popover-foreground': '0 40% 98%',
        '--card': '0 84% 4.9%',
        '--card-foreground': '0 40% 98%',
        '--border': '7.2 32.6% 17.5%',
        '--input': '7.2 32.6% 17.5%',
        '--primary': '346.8 77.2% 49.8%',
        '--primary-foreground': '0 84% 4.9%',
        '--secondary': '7.2 32.6% 17.5%',
        '--secondary-foreground': '0 40% 98%',
        '--accent': '7.2 32.6% 17.5%',
        '--accent-foreground': '0 40% 98%',
        '--destructive': '0 62.8% 30.6%',
        '--destructive-foreground': '0 40% 98%',
        '--ring': '346.8 77.2% 49.8%',
        '--chart-1': '346.8 77.2% 49.8%',
        '--chart-2': '7.2 32.6% 17.5%',
        '--chart-3': '7.2 32.6% 25%',
        '--chart-4': '7.2 32.6% 30%',
        '--chart-5': '346.8 77.2% 65%',
      },
    },
  },
];

export function applyTheme(theme: Theme, currentMode: string = 'light') {
  const root = document.documentElement;

  // Determine which variables to apply based on current mode
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = currentMode === 'dark' || (currentMode === 'system' && isSystemDark);

  const variablesToApply = isDark ? theme.cssVariables.dark : theme.cssVariables.light;

  // Apply the appropriate theme variables to :root (this won't affect focus)
  Object.entries(variablesToApply).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Check if theme style already exists and update it, don't recreate
  let themeStyle = document.getElementById('custom-theme-style') as HTMLStyleElement;

  if (!themeStyle) {
    themeStyle = document.createElement('style');
    themeStyle.id = 'custom-theme-style';
    document.head.appendChild(themeStyle);
  }

  // Update the content without removing/adding the element
  themeStyle.textContent = `
    :root {
      ${Object.entries(theme.cssVariables.light)
        .map(([property, value]) => `${property}: ${value};`)
        .join('\n      ')}
    }
    
    .dark {
      ${Object.entries(theme.cssVariables.dark)
        .map(([property, value]) => `${property}: ${value};`)
        .join('\n      ')}
    }
  `;
}

export function parseThemeFromCss(cssText: string, themeName?: string): Theme | null {
  try {
    const lightMatch = cssText.match(/:root\s*\{([^}]+)\}/);
    const darkMatch = cssText.match(/\.dark\s*\{([^}]+)\}/);

    if (!lightMatch) return null;

    const parseVariables = (text: string): Record<string, string> => {
      const variables: Record<string, string> = {};
      const lines = text.split(';').filter((line) => line.trim());

      lines.forEach((line) => {
        const [property, value] = line.split(':').map((s) => s.trim());
        if (property && value && property.startsWith('--')) {
          variables[property] = value;
        }
      });

      return variables;
    };

    const lightVariables = parseVariables(lightMatch[1]);
    const darkVariables = darkMatch ? parseVariables(darkMatch[1]) : lightVariables;

    return {
      name: themeName || 'Custom Theme',
      id: `custom-${Date.now()}`,
      isCustom: true,
      isEditable: true,
      createdAt: new Date().toISOString(),
      cssVariables: {
        light: lightVariables,
        dark: darkVariables,
      },
    };
  } catch (error) {
    console.error('Error parsing theme CSS:', error);
    return null;
  }
}
