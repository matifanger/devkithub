import { Lightbulb, RefreshCw } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useClipboardRecommendations } from '../../hooks/use-clipboard-recommendations';
import { Tool } from '../../utils/tools-data';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';

interface RecommendedToolItemProps {
  tool: Tool;
}

function RecommendedToolItem({ tool }: RecommendedToolItemProps) {
  return (
    <SidebarMenuItem className="flex items-center group text-muted-foreground">
      <SidebarMenuButton asChild>
        <Link
          to={tool.url}
          className="flex items-center gap-3 pl-2 rounded-lg hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors overflow-hidden w-full"
        >
          <tool.icon className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium truncate hover:animate-scroll whitespace-nowrap">
            {tool.title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function RecommendedTools() {
  const { detectionResult, recommendedTools, isLoading, refresh, isEnabled, isSettingsLoading } =
    useClipboardRecommendations();

  // Don't render anything while settings are loading to prevent flash effect
  if (isSettingsLoading) {
    return null;
  }

  // Don't render anything if the feature is disabled
  if (!isEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-3 h-3 text-muted-foreground" />
            <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Analyzing Clipboard
            </div>
          </div>
          <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (!detectionResult || recommendedTools.length === 0) {
    return null;
  }

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

  const contentLabel = contentTypeLabels[detectionResult.type] || detectionResult.type;

  return (
    <div className="mb-1">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Recommended
          </div>
        </div>
        {/* <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-transparent"
          onClick={refresh}
          title="Refresh clipboard detection"
        >
          <RefreshCw className="w-3 h-3 text-muted-foreground hover:text-foreground" />
        </Button> */}
      </div>

      <div className="px-2 mb-2">
        <div className="text-xs text-muted-foreground/70">
          Detected:{' '}
          <span className="text-amber-600 dark:text-amber-400 font-medium">{contentLabel}</span>
          {detectionResult.confidence && (
            <span className="ml-1">
              ({Math.round(detectionResult.confidence * 100)}% confidence)
            </span>
          )}
        </div>
      </div>

      <SidebarMenu>
        {recommendedTools.map((tool) => (
          <RecommendedToolItem key={tool.id} tool={tool} />
        ))}
      </SidebarMenu>
    </div>
  );
}
