import * as React from "react"
import { Link } from "react-router-dom"
import { 
  Hash, 
  FileJson, 
  Clock, 
  Key, 
  Palette, 
  FileCode, 
  Image, 
  Regex, 
  Link as LinkIcon, 
  Code, 
  Slash, 
  FileText, 
  FileCode2, 
  FileJson2, 
  FileType2, 
  Database, 
  ListOrdered, 
  Binary, 
  FileType, 
  FileEdit, 
  FilePlus2, 
  FileJson2 as FileJson3, 
  FileSpreadsheet, 
  TextCursor, 
  Text, 
  Database as Database2, 
  FileCode as PhpIcon, 
  FileKey2, 
  Timer, 
  QrCode,
  Bug,
  User,
  Search
} from "lucide-react"

import { ThemeToggle } from "./ui/theme-toggle"
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
} from './ui/sidebar'
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { ScrollArea } from "./ui/scroll-area"
import { Input } from "./ui/input"

const data = {
  user: {
    email: "user@example.com"
  },
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Tools",
      url: "/",
      items: [
        {
          title: "Hash Generator",
          url: "/hash-generator",
          icon: <Hash className="w-4 h-4" />,
        },
        {
          title: "Number Base Converter",
          url: "/number-base-converter",
          icon: <Binary className="w-4 h-4" />,
        },
        {
          title: "YAML to JSON",
          url: "/yaml-to-json",
          icon: <FileJson className="w-4 h-4" />,
        },
        {
          title: "JSON to YAML",
          url: "/json-to-yaml",
          icon: <FileJson className="w-4 h-4" />,
        },
        {
          title: "JSON Format/Validate",
          url: "/json-format",
          icon: <FileJson className="w-4 h-4" />,
        },
        {
          title: "Unix Time Converter and Analysis",
          url: "/unix-time",
          icon: <Clock className="w-4 h-4" />,
        },
        {
          title: "JWT Debugger",
          url: "/jwt-debug",
          icon: <Key className="w-4 h-4" />,
        },
        {
          title: "Color Converter",
          url: "/color-converter",
          icon: <Palette className="w-4 h-4" />,
        },
        {
          title: "Base64 String Encoder/Decoder",
          url: "/base64-string-encoder-decoder",
          icon: <FileCode className="w-4 h-4" />,
        },
        {
          title: "Base64 Image Encoder/Decoder",
          url: "/base64-image-encoder-decoder",
          icon: <Image className="w-4 h-4" />,
        },
        {
          title: "Regex Tester",
          url: "/regex-tester",
          icon: <Regex className="w-4 h-4" />,
        },
        {
          title: "URL Encoder/Decoder",
          url: "/url-encoder-decoder",
          icon: <LinkIcon className="w-4 h-4" />,
        },
        {
          title: "HTML Entity Encoder/Decoder",
          url: "/html-entity-encoder-decoder",
          icon: <Code className="w-4 h-4" />,
        },
        {
          title: "Backslash Escape/Unescape",
          url: "/backslash-escape-unescape",
          icon: <Slash className="w-4 h-4" />,
        },
        {
          title: "HTML Beautify/Minify",
          url: "/html-beautify",
          icon: <FileText className="w-4 h-4" />,
        },
        {
          title: "CSS Beautify/Minify",
          url: "/css-beautify",
          icon: <FileCode2 className="w-4 h-4" />,
        },
        {
          title: "JavaScript Beautify/Minify",
          url: "/js-beautify",
          icon: <FileJson2 className="w-4 h-4" />,
        },
        {
          title: "XML Beautify/Minify",
          url: "/xml-beautify",
          icon: <FileType2 className="w-4 h-4" />,
        },
        {
          title: "SQL Formatter",
          url: "/sql-formatter",
          icon: <Database className="w-4 h-4" />,
        },
        {
          title: "Line Sort/Dedupe",
          url: "/line-sort-dedupe",
          icon: <ListOrdered className="w-4 h-4" />,
        },
        {
          title: "Hex to ASCII",
          url: "/hex-to-ascii",
          icon: <Binary className="w-4 h-4" />,
        },
        {
          title: "ASCII to Hex",
          url: "/ascii-to-hex",
          icon: <Binary className="w-4 h-4" />,
        },
        {
          title: "HTML Preview",
          url: "/html-preview",
          icon: <FileType className="w-4 h-4" />,
        },
        {
          title: "Markdown Preview",
          url: "/markdown-preview",
          icon: <FileEdit className="w-4 h-4" />,
        },
        {
          title: "HTML to JSX",
          url: "/html-to-jsx",
          icon: <FilePlus2 className="w-4 h-4" />,
        },
        {
          title: "JSON to CSV",
          url: "/json-to-csv",
          icon: <FileJson3 className="w-4 h-4" />,
        },
        {
          title: "CSV to JSON",
          url: "/csv-to-json",
          icon: <FileSpreadsheet className="w-4 h-4" />,
        },
        {
          title: "String Case Converter",
          url: "/string-case-converter",
          icon: <TextCursor className="w-4 h-4" />,
        },
        {
          title: "Random String Generator",
          url: "/random-string-generator",
          icon: <Text className="w-4 h-4" />,
        },
        {
          title: "Dummy Data Generator",
          url: "/dummy-data-generator",
          icon: <Database2 className="w-4 h-4" />,
        },
        {
          title: "PHP Serializer",
          url: "/php-serializer",
          icon: <PhpIcon className="w-4 h-4" />,
        },
        {
          title: "PHP Deserializer",
          url: "/php-deserializer",
          icon: <PhpIcon className="w-4 h-4" />,
        },
        {
          title: "Certificate Decoder (X.509)",
          url: "/certificate-decoder",
          icon: <FileKey2 className="w-4 h-4" />,
        },
        {
          title: "Cron Job Parser",
          url: "/cron-job-parser",
          icon: <Timer className="w-4 h-4" />,
        },
        {
          title: "QR Code Reader/Generator",
          url: "/qr-code",
          icon: <QrCode className="w-4 h-4" />,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedTool, setSelectedTool] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return data.navMain[0].items
    
    return data.navMain[0].items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const handleBugReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(event.currentTarget)
    const description = formData.get("description")
    
    try {
      const response = await fetch("https://www.matifanger.dev/form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: selectedTool,
          description,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to submit bug report")
      }
      
      // Reset form and close modal
      event.currentTarget.reset()
      setSelectedTool("")
    } catch (error) {
      console.error("Error submitting bug report:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b">
        <div className="p-4">
          <Button variant="ghost" className="w-full justify-start gap-2 px-2 h-auto py-3">
            <User className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span className="font-medium">{data.user.email}</span>
              <span className="text-xs text-muted-foreground">Settings & Profile</span>
            </div>
          </Button>
        </div>
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Report Bug
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleBugReport}>
              <DialogHeader>
                <DialogTitle>Report a Bug</DialogTitle>
                <DialogDescription>
                  Let us know about any issues you've encountered. We'll look into it as soon as possible.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tool">Tool</Label>
                  <select
                    id="tool"
                    name="tool"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    required
                  >
                    <option value="">Select a tool</option>
                    {data.navMain[0].items.map((item) => (
                      <option key={item.url} value={item.url}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Please describe the issue in detail..."
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Report"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <SidebarRail />
    </Sidebar>
  )
}
