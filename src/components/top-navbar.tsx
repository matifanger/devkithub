import {
  AppWindow,
  ArrowLeft,
  ArrowRight,
  Crown,
  Home,
  Lightbulb,
  Minus,
  Monitor,
  Moon,
  Search,
  Settings,
  Square,
  Sun,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/icons/icon.png';
import { UPDATE_THEME_KEY } from '../constants/settings-keys';
import { useAuth } from '../contexts/auth-context';
import { useUpgradeModal } from '../contexts/upgrade-modal-context';
import { useClipboardRecommendations } from '../hooks/use-clipboard-recommendations';
import { useProfileModal } from '../layouts/app-layout';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

function NavigationControls() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsProfileOpen } = useProfileModal();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const historyStack = useRef<string[]>(['/']);
  const currentIndex = useRef(0);

  useEffect(() => {
    const path = location.pathname;
    if (path !== historyStack.current[currentIndex.current]) {
      if (historyStack.current.slice(0, currentIndex.current + 1).includes(path)) {
        currentIndex.current = historyStack.current.indexOf(path);
      } else {
        historyStack.current = historyStack.current.slice(0, currentIndex.current + 1);
        historyStack.current.push(path);
        currentIndex.current = historyStack.current.length - 1;
      }
    }
    setCanGoBack(currentIndex.current > 0);
    setCanGoForward(currentIndex.current < historyStack.current.length - 1);
  }, [location.pathname]);

  const handleGoBack = () => {
    if (currentIndex.current > 0) {
      currentIndex.current -= 1;
      navigate(historyStack.current[currentIndex.current]);
    }
  };

  const handleGoForward = () => {
    if (currentIndex.current < historyStack.current.length - 1) {
      currentIndex.current += 1;
      navigate(historyStack.current[currentIndex.current]);
    }
  };

  const handleGoHome = () => {
    if (location.pathname !== '/') {
      if (currentIndex.current < historyStack.current.length - 1) {
        historyStack.current = historyStack.current.slice(0, currentIndex.current + 1);
      }
      historyStack.current.push('/');
      currentIndex.current = historyStack.current.length - 1;
      navigate('/', { replace: true });
    }
  };

  const handleOpenSettings = () => {
    setIsProfileOpen(true);
  };

  const isHome = location.pathname === '/';

  return (
    <div
      className="flex items-center"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button
        onClick={handleGoBack}
        disabled={!canGoBack}
        className="flex items-center justify-center hover:bg-accent hover:text-foreground rounded transition-colors w-8 h-7 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <button
        onClick={handleGoForward}
        disabled={!canGoForward}
        className="flex items-center justify-center hover:bg-accent hover:text-foreground rounded transition-colors w-8 h-7 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        onClick={handleGoHome}
        disabled={isHome}
        className="flex items-center justify-center hover:bg-accent hover:text-foreground rounded transition-colors w-8 h-7 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Home className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        onClick={handleOpenSettings}
        className="flex items-center justify-center hover:bg-accent hover:text-foreground rounded transition-colors w-8 h-7"
      >
        <Settings className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <ThemeToggleButton />
      <ClipboardRecommendations />
    </div>
  );
}

function ClipboardRecommendations() {
  const { detectionResult, recommendedTools, isLoading, isEnabled } = useClipboardRecommendations();
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'linux'>('windows');

  useEffect(() => {
    const platformLower = navigator.platform.toLowerCase();
    if (platformLower.includes('mac') || platformLower.includes('darwin')) {
      setPlatform('mac');
    } else if (platformLower.includes('win')) {
      setPlatform('windows');
    } else {
      setPlatform('linux');
    }
  }, []);

  if (!isEnabled) {
    return null;
  }

  const hasRecommendations = !isLoading && detectionResult && recommendedTools.length > 0;

  const contentTypeLabels: Record<string, string> = {
    json: 'JSON',
    yaml: 'YAML',
    html: 'HTML',
    css: 'CSS',
    javascript: 'JavaScript',
    xml: 'XML',
    sql: 'SQL',
    hex: 'Hexadecimal',
    base64: 'Base64',
    url: 'URL',
    jwt: 'JWT Token',
    'unix-timestamp': 'Unix Timestamp',
    regex: 'Regular Expression',
    cron: 'Cron Expression',
    csv: 'CSV Data',
    markdown: 'Markdown',
    curl: 'cURL Command',
    'php-serialized': 'PHP Serialized',
    color: 'Color Code',
    number: 'Number',
    text: 'Text',
  };

  const contentLabel = detectionResult
    ? contentTypeLabels[detectionResult.type] || detectionResult.type
    : '';

  const popoverAlign = platform === 'mac' ? 'end' : 'start';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex items-center justify-center hover:bg-accent hover:text-foreground rounded transition-colors w-8 h-7">
          <Lightbulb className="w-4 h-4" />
          {hasRecommendations && (
            <span className="absolute -top-2 -right-0.5 w-2.5 h-2.5">
              <span className="absolute top-[0.57rem] left-0 inline-flex w-full h-full bg-amber-500 rounded-full opacity-75 animate-ping-5s" />
              <span className="relative inline-flex w-2 h-2 bg-amber-500 rounded-full" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align={popoverAlign} sideOffset={8}>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
            <Search className="w-4 h-4 animate-pulse" />
            <span>Analyzing clipboard...</span>
          </div>
        ) : hasRecommendations ? (
          <div className="space-y-2">
            <div className="border-b">
              <div className="pt-3 px-3 pb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Recommended</span>
                </div>
                <div className="text-xs text-muted-foreground ml-[1.60rem]">
                  Detected:{' '}
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {contentLabel}
                  </span>
                  {detectionResult.confidence && (
                    <span className="ml-1">
                      ({Math.round(detectionResult.confidence * 100)}% confidence)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-1 pb-3 px-3 pt-2">
              {recommendedTools.slice(0, 4).map((tool) => (
                <Link
                  key={tool.id}
                  to={tool.url}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <tool.icon className={`w-4 h-4 flex-shrink-0 ${tool.color}`} />
                      <span className="text-sm font-medium text-black dark:text-white">
                        {tool.title}
                      </span>
                    </div>
                    <span className="text-xs text-black/70 dark:text-white/60 ml-6 mr-2">
                      {tool.description}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-2">
            No recommendations available
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadSavedTheme = async () => {
      const savedTheme = await window.electron.settingsStore.get(UPDATE_THEME_KEY);
      if (savedTheme) {
        setTheme(savedTheme);
      }
    };
    loadSavedTheme();
    setMounted(true);
  }, [setTheme]);

  const handleToggle = async () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme || 'system');
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    await window.electron.settingsStore.set(UPDATE_THEME_KEY, nextTheme);
  };

  if (!mounted) {
    return (
      <button className="flex items-center justify-center w-8 h-7">
        <Sun className="w-4 h-4" />
      </button>
    );
  }

  const getIcon = () => {
    if (theme === 'dark') {
      return <Moon className="w-4 h-4" />;
    } else if (theme === 'system') {
      return <Monitor className="w-4 h-4" />;
    }
    return <Sun className="w-4 h-4" />;
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center justify-center hover:bg-accent hover:text-foreground rounded transition-colors w-8 h-7"
    >
      <span key={theme} className="animate-theme-icon">
        {getIcon()}
      </span>
    </button>
  );
}

function WindowControls({
  isMac,
  onUpgradeClick,
}: {
  isMac: boolean;
  onUpgradeClick?: () => void;
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const { isPro } = useUpgradeModal();

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.electron.window.isMaximized();
      setIsMaximized(maximized);
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electron.window.minimize();
  };

  const handleMaximize = async () => {
    await window.electron.window.maximize();
    const maximized = await window.electron.window.isMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = () => {
    window.electron.window.close();
  };

  const closeButton = (
    <button
      onClick={handleClose}
      className="flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors w-10 h-7 rounded"
    >
      <X className="w-4 h-4" />
    </button>
  );

  const upgradeButton = isPro ? (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={onUpgradeClick}
        className="flex items-center justify-center bg-gradient-to-r from-emerald-500 to-green-400 text-emerald-950 font-semibold text-xs rounded transition-all w-16 h-7 gap-1"
      >
        <Crown className="w-3.5 h-3.5" />
        <span>Pro</span>
      </button>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={onUpgradeClick}
        className="flex items-center justify-center bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-semibold text-xs rounded transition-all w-20 h-7 gap-1"
      >
        <Crown className="w-3.5 h-3.5" />
        <span>Get Pro</span>
      </button>
    </div>
  );

  const minimizeButton = (
    <button
      onClick={handleMinimize}
      className="flex items-center justify-center hover:bg-accent hover:text-foreground rounded transition-colors w-10 h-7"
    >
      <Minus className="w-4 h-4" />
    </button>
  );

  const maximizeButton = (
    <button
      onClick={handleMaximize}
      className="flex items-center justify-center hover:bg-accent hover:text-foreground rounded transition-colors w-10 h-7"
    >
      {isMaximized ? <Square className="w-3.5 h-3.5" /> : <AppWindow className="w-3.5 h-3.5" />}
    </button>
  );

  const controls = (
    <div
      className="flex items-center gap-1"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {isMac ? (
        <>
          {closeButton}
          {minimizeButton}
          {maximizeButton}
          {upgradeButton}
        </>
      ) : (
        <>
          {upgradeButton}
          {minimizeButton}
          {maximizeButton}
          {closeButton}
        </>
      )}
    </div>
  );

  return controls;
}

export function TopNavbar() {
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'linux'>('windows');

  useEffect(() => {
    const checkPlatform = async () => {
      const platformLower = navigator.platform.toLowerCase();
      if (platformLower.includes('mac') || platformLower.includes('darwin')) {
        setPlatform('mac');
      } else if (platformLower.includes('win')) {
        setPlatform('windows');
      } else {
        setPlatform('linux');
      }
    };
    checkPlatform();
  }, []);

  const showControlsOnLeft = platform === 'mac';
  const showControlsOnRight = platform === 'windows' || platform === 'linux';
  const { openModal: openUpgradeModal, isPro } = useUpgradeModal();
  const { isAuthenticated } = useAuth();
  const { setIsProfileOpen, setActiveTab } = useProfileModal();

  const handleProClick = () => {
    setActiveTab('license');
    setIsProfileOpen(true);
  };

  return (
    <header
      className="relative flex items-center justify-between h-10 px-1 bg-background border-b select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {showControlsOnLeft && (
        <>
          <WindowControls isMac={true} onUpgradeClick={handleProClick} />
          <NavigationControls />
        </>
      )}

      {!showControlsOnLeft && <NavigationControls />}

      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 h-full cursor-default pointer-events-none"
        onDoubleClick={async () => {
          await window.electron.window.maximize();
        }}
      >
        <img src={logo} alt="DevKitHub" className="w-5 h-5" />
        <span className="font-semibold text-sm">DevKitHub</span>
      </div>

      {showControlsOnRight && <WindowControls isMac={false} onUpgradeClick={handleProClick} />}
    </header>
  );
}
