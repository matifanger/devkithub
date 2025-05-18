import { MessageCircle, Search, User } from 'lucide-react';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/auth-context';
import { allTools } from '../utils/tools-data';
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const { userData } = useAuth();

  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return allTools;

    return allTools.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  return (
    <Sidebar {...props}>
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
              className="pl-8 border-gray-300 dark:border-gray-600"
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
                    {filteredItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link
                            to={item.url}
                            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors"
                          >
                            <item.icon className="w-4 h-4" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          </div>
        </SidebarContent>
      </ScrollArea>
      <div className="border-t p-4 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => window.electron.openExternal('https://devkithub.featurebase.app/en')}
        >
          <MessageCircle className="w-4 h-4" />
          Feedback & Bug Reports
        </Button>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
