import {
  Binary,
  Clock,
  Code,
  Database,
  Database as Database2,
  FileCode,
  FileCode2,
  FileEdit,
  FileJson,
  FileJson2,
  FileJson2 as FileJson3,
  FileKey2,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FileType,
  FileType2,
  Hash,
  Image,
  Key,
  Link as LinkIcon,
  ListOrdered,
  MessageCircle,
  Palette,
  FileCode as PhpIcon,
  QrCode,
  Regex,
  Search,
  Slash,
  Text,
  TextCursor,
  Timer,
  Type,
  User,
} from 'lucide-react';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/auth-context';
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

const data = {
  user: {
    email: 'user@example.com',
  },
  versions: ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'],
  navMain: [
    {
      title: 'Tools',
      url: '/',
      items: [
        {
          title: 'Hash Generator',
          url: '/hash-generator',
          icon: <Hash className="w-4 h-4" />,
        },
        {
          title: 'Number Base Converter',
          url: '/number-base-converter',
          icon: <Binary className="w-4 h-4" />,
        },
        {
          title: 'YAML to JSON',
          url: '/yaml-to-json',
          icon: <FileJson className="w-4 h-4" />,
        },
        {
          title: 'JSON to YAML',
          url: '/json-to-yaml',
          icon: <FileJson className="w-4 h-4" />,
        },
        {
          title: 'JSON Format/Validate',
          url: '/json-format',
          icon: <FileJson className="w-4 h-4" />,
        },
        {
          title: 'Unix Time Converter and Analysis',
          url: '/unix-time',
          icon: <Clock className="w-4 h-4" />,
        },
        {
          title: 'JWT Debugger',
          url: '/jwt-debug',
          icon: <Key className="w-4 h-4" />,
        },
        {
          title: 'Color Converter',
          url: '/color-converter',
          icon: <Palette className="w-4 h-4" />,
        },
        {
          title: 'Base64 String Encoder/Decoder',
          url: '/base64-string-encoder-decoder',
          icon: <FileCode className="w-4 h-4" />,
        },
        {
          title: 'Base64 Image Encoder/Decoder',
          url: '/base64-image-encoder-decoder',
          icon: <Image className="w-4 h-4" />,
        },
        {
          title: 'Regex Tester',
          url: '/regex-tester',
          icon: <Regex className="w-4 h-4" />,
        },
        {
          title: 'URL Encoder/Decoder',
          url: '/url-encoder-decoder',
          icon: <LinkIcon className="w-4 h-4" />,
        },
        {
          title: 'URL Parser',
          url: '/url-parser',
          icon: <LinkIcon className="w-4 h-4" />,
        },
        {
          title: 'HTML Entity Encoder/Decoder',
          url: '/html-entity-encoder-decoder',
          icon: <Code className="w-4 h-4" />,
        },
        {
          title: 'Backslash Escape/Unescape',
          url: '/backslash-escape-unescape',
          icon: <Slash className="w-4 h-4" />,
        },
        {
          title: 'HTML Beautify/Minify',
          url: '/html-beautify',
          icon: <FileText className="w-4 h-4" />,
        },
        {
          title: 'CSS Beautify/Minify',
          url: '/css-beautify',
          icon: <FileCode2 className="w-4 h-4" />,
        },
        {
          title: 'JavaScript Beautify/Minify',
          url: '/js-beautify',
          icon: <FileJson2 className="w-4 h-4" />,
        },
        {
          title: 'XML Beautify/Minify',
          url: '/xml-beautify',
          icon: <FileType2 className="w-4 h-4" />,
        },
        {
          title: 'SQL Formatter',
          url: '/sql-formatter',
          icon: <Database className="w-4 h-4" />,
        },
        {
          title: 'Line Sort/Dedupe',
          url: '/line-sort-dedupe',
          icon: <ListOrdered className="w-4 h-4" />,
        },
        {
          title: 'Hex to ASCII',
          url: '/hex-to-ascii',
          icon: <Binary className="w-4 h-4" />,
        },
        {
          title: 'ASCII to Hex',
          url: '/ascii-to-hex',
          icon: <Binary className="w-4 h-4" />,
        },
        {
          title: 'HTML Preview',
          url: '/html-preview',
          icon: <FileType className="w-4 h-4" />,
        },
        {
          title: 'Markdown Preview',
          url: '/markdown-preview',
          icon: <FileEdit className="w-4 h-4" />,
        },
        {
          title: 'HTML to JSX',
          url: '/html-to-jsx',
          icon: <FilePlus2 className="w-4 h-4" />,
        },
        {
          title: 'JSON to CSV',
          url: '/json-to-csv',
          icon: <FileJson3 className="w-4 h-4" />,
        },
        {
          title: 'CSV to JSON',
          url: '/csv-to-json',
          icon: <FileSpreadsheet className="w-4 h-4" />,
        },
        {
          title: 'String Case Converter',
          url: '/string-case-converter',
          icon: <TextCursor className="w-4 h-4" />,
        },
        {
          title: 'Random String Generator',
          url: '/random-string-generator',
          icon: <Text className="w-4 h-4" />,
        },
        {
          title: 'Dummy Data Generator',
          url: '/dummy-data-generator',
          icon: <Database2 className="w-4 h-4" />,
        },
        {
          title: 'PHP Serializer',
          url: '/php-serializer',
          icon: <PhpIcon className="w-4 h-4" />,
        },
        {
          title: 'PHP Deserializer',
          url: '/php-deserializer',
          icon: <PhpIcon className="w-4 h-4" />,
        },
        {
          title: 'Certificate Decoder (X.509)',
          url: '/certificate-decoder',
          icon: <FileKey2 className="w-4 h-4" />,
        },
        {
          title: 'Cron Job Parser',
          url: '/cron-job-parser',
          icon: <Timer className="w-4 h-4" />,
        },
        {
          title: 'QR Code Reader/Generator',
          url: '/qr-code',
          icon: <QrCode className="w-4 h-4" />,
        },
        {
          title: 'Lorem Ipsum Generator',
          url: '/lorem-ipsum',
          icon: <Type className="w-4 h-4" />,
        },
        {
          title: 'Text Diff Checker',
          url: '/text-diff',
          icon: <FileText className="w-4 h-4" />,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const { userData } = useAuth();

  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return data.navMain[0].items;

    return data.navMain[0].items.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
              <span className="font-medium">{userData?.email || 'Not logged in'}</span>
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
                            {item.icon}
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
