import { MessageCircle, Search, Star, User } from 'lucide-react';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { useEffect, useState } from 'react';
import { FAVORITE_TOOLS_KEY } from '../constants/settings-keys';
import { useAuth } from '../contexts/auth-context';
import { allTools, Tool } from '../utils/tools-data';
import { ProfileModal } from './profile-modal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from './ui/sidebar';
import { ThemeToggle } from './ui/theme-toggle';

interface ToolItemProps {
  tool: Tool;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
}

function ToolItem({ tool, isFavorite, onToggleFavorite }: ToolItemProps) {
  return (
    <SidebarMenuItem className="flex items-center justify-between group">
      <SidebarMenuButton asChild>
        <Link
          to={tool.url}
          className="flex items-center justify-between gap-2 pl-2 rounded-lg hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors overflow-hidden"
        >
          <div className="flex items-center gap-3 min-w-0 w-48">
            <tool.icon className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium truncate hover:animate-scroll whitespace-nowrap">
              {tool.title}
            </span>
          </div>
        </Link>
      </SidebarMenuButton>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-transparent mr-0.5 flex-shrink-0"
        onClick={() => onToggleFavorite(tool.id)}
      >
        <Star
          className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      </Button>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [favoriteTools, setFavoriteTools] = React.useState<Tool[]>([]);
  const { userData } = useAuth();

  useEffect(() => {
    const fetchCurrentVersion = async () => {
      const currentVersion = await window.electron.env.get('npm_package_version');
      setCurrentVersion(currentVersion);
    };
    fetchCurrentVersion();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      const storedFavorites = await window.electron.settingsStore.get(FAVORITE_TOOLS_KEY);
      const favorites: string[] = storedFavorites ? JSON.parse(storedFavorites) : [];
      const favoriteToolsData = allTools.filter((tool) => favorites.includes(tool.id));
      setFavoriteTools(favoriteToolsData);
    };
    fetchFavorites();
  }, []);

  const toggleFavorite = async (toolId: string) => {
    let updatedFavorites;
    if (favoriteTools.some((tool) => tool.id === toolId)) {
      updatedFavorites = favoriteTools.filter((tool) => tool.id !== toolId);
    } else {
      const toolToAdd = allTools.find((tool) => tool.id === toolId);
      if (toolToAdd) {
        updatedFavorites = [...favoriteTools, toolToAdd];
      } else {
        return;
      }
    }
    setFavoriteTools(updatedFavorites);
    await window.electron.settingsStore.set(
      FAVORITE_TOOLS_KEY,
      JSON.stringify(updatedFavorites.map((tool) => tool.id))
    );
  };

  const filteredItems = React.useMemo(() => {
    if (!searchQuery)
      return allTools.filter((tool) => !favoriteTools.some((fav) => fav.id === tool.id));

    return allTools.filter(
      (item) =>
        !favoriteTools.some((fav) => fav.id === item.id) &&
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, favoriteTools]);

  return (
    <Sidebar {...props}>
      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(0); }
            40% { transform: translateX(0); }
            80% { transform: translateX(calc(-100% + 200px)); }
            100% { transform: translateX(0); }
          }
          .animate-scroll {
            animation: scroll 5s linear infinite;
            animation-play-state: paused;
          }
          .animate-scroll:hover {
            animation-play-state: running;
          }
        `}
      </style>
      <SidebarHeader className="border-b">
        <div className="p-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-2 h-auto py-3"
            onClick={() => setIsProfileOpen(true)}
          >
            <User className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Welcome</span>
              <span className="text-xs text-muted-foreground">Settings & Profile</span>
            </div>
          </Button>
          <ProfileModal open={isProfileOpen} onOpenChange={setIsProfileOpen} userData={userData} />
        </div>
        <div className="">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              spellCheck={false}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarContent className="gap-0">
          <div className="relative">
            {/* Beautiful gradient background */}
            {/* <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted opacity-80 dark:from-background dark:via-background/50 dark:to-accent pointer-events-none" /> */}
            {/* Glass effect overlay */}
            {/* <div className="absolute inset-0  backdrop-blur-sm pointer-events-none" /> */}
            {/* Content */}
            <div className="relative">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {favoriteTools.length > 0 && (
                      <div className="mb-1">
                        <div className="px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                          Favorites
                        </div>
                        {favoriteTools.map((tool) => (
                          <ToolItem
                            key={tool.id}
                            tool={tool}
                            isFavorite={true}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                    <div className="px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-0.5">
                      All Tools
                    </div>
                    {filteredItems.map((tool) => (
                      <ToolItem
                        key={tool.id}
                        tool={tool}
                        isFavorite={false}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          </div>
        </SidebarContent>
      </ScrollArea>
      <div className="border-t pl-2 pr-2 pt-2 pb-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => window.electron.openExternal('https://devkithub.featurebase.app/en')}
          >
            <MessageCircle className="w-4 h-4" />
            Community
          </Button>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-center">
          <Button
            variant="link"
            className="text-xs text-muted-foreground p-1"
            onClick={() => window.electron.openExternal('https://devkithub.com')}
          >
            DevKitHub.com
          </Button>
          <Button
            variant="link"
            className="text-xs text-muted-foreground p-1"
            onClick={() => window.electron.openExternal('https://devkithub.com/changelog')}
          >
            v{currentVersion}
          </Button>
        </div>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
