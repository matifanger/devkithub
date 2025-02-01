import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import { SearchForm } from "./search-form"
import { VersionSwitcher } from "./version-switcher"
import { ThemeToggle } from "./ui/theme-toggle"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '../components/ui/sidebar'

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Tools",
      url: "/",
      items: [
        {
          title: "Hash Generator",
          url: "/hash-generator",
        },
        {
          title: "YAML to JSON",
          url: "/yaml-to-json",
        },
        {
          title: "JSON Format/Validate",
          url: "/json-format",
        },
        {
          title: "Unix Time Converter and Analysis",
          url: "/unix-time",
        },
        {
          title: "JWT Debugger",
          url: "/jwt-debug",
        },
        {
          title: "Color Converter",
          url: "/color-converter",
        },
        {
          title: "Base64 String Encoder/Decoder",
          url: "/base64-string-encoder-decoder",
        },
        {
          title: "Base64 Image Encoder/Decoder",
          url: "/base64-image-encoder-decoder",
        },
        {
          title: "Regex Tester",
          url: "/regex-tester",
        },
        {
          title: "URL Encoder/Decoder",
          url: "/url-encoder-decoder",
        },
        {
          title: "HTML Entity Encoder/Decoder",
          url: "/html-entity-encoder-decoder",
        },
        {
          title: "Backslash Escape/Unescape",
          url: "/backslash-escape-unescape",
        },
        {
          title: "HTML Beautify/Minify",
          url: "/html-beautify",
        },
        {
          title: "CSS Beautify/Minify",
          url: "/css-beautify",
        },
        {
          title: "JavaScript Beautify/Minify",
          url: "/js-beautify",
        },
        {
          title: "XML Beautify/Minify",
          url: "/xml-beautify",
        },
        {
          title: "LESS Beautify/Minify",
          url: "/less-beautify",
        },
        {
          title: "SCSS Beautify/Minify",
          url: "/scss-beautify",
        },
        {
          title: "Line Sort/Dedupe",
          url: "/line-sort-dedupe",
        },
        {
          title: "Hex to ASCII",
          url: "/hex-to-ascii",
        },
        {
          title: "ASCII to Hex",
          url: "/ascii-to-hex",
        },
        {
          title: "HTML Preview",
          url: "/html-preview",
        },
        {
          title: "Markdown Preview",
          url: "/markdown-preview",
        },
        {
          title: "HTML to JSX",
          url: "/html-to-jsx",
        },
        {
          title: "JSON to CSV",
          url: "/json-to-csv",
        },
        {
          title: "CSV to JSON",
          url: "/csv-to-json",
        },
        {
          title: "PHP Serializer",
          url: "/php-serializer",
        },
        {
          title: "PHP Deserializer",
          url: "/php-deserializer",
        },
        {
          title: "Cron Job Parser",
          url: "/cron-job-parser",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between px-4">
          <VersionSwitcher
            versions={data.versions}
            defaultVersion={data.versions[0]}
          />
          <ThemeToggle />
        </div>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <CollapsibleTrigger>
                  {item.title}{" "}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link to={item.url}>{item.title}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
