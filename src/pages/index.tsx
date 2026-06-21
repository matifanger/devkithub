import { Search, X, Lock } from "lucide-react";
import * as React from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { NewsCarousel, useNewsItems } from "../components/news-carousel";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { useUpgradeModal } from "../contexts/upgrade-modal-context";
import { allTools, Category, categoryLabels, Tool } from "../utils/tools-data";

function ToolItem({ tool }: { tool: Tool }) {
  const { openModal: openUpgradeModal, isPro } = useUpgradeModal();

  const handleClick = (e: React.MouseEvent) => {
    if (tool.premium && !isPro) {
      e.preventDefault();
      openUpgradeModal();
    }
  };

  return (
    <Link
      to={tool.premium && !isPro ? "#" : tool.url}
      onClick={handleClick}
      className="flex justify-center w-full rounded-md group"
    >
      <span className="flex flex-col w-fit min-w-full py-2 px-3 rounded-md hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3">
          <tool.icon className={`w-4 h-4 flex-shrink-0 ${tool.color}`} />
          <span className="text-sm font-medium text-black dark:text-white transition-colors">
            {tool.title}
          </span>
          {tool.premium && !isPro && (
            <Lock className="w-3 h-3 text-amber-500 ml-auto" />
          )}
        </div>
        <span className="text-xs text-black/70 dark:text-white/60 mt-1 ml-7">
          {tool.description}
        </span>
      </span>
    </Link>
  );
}

function CategorySection({
  category,
  tools,
}: {
  category: Category;
  tools: Tool[];
}) {
  if (tools.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-3">
        {categoryLabels[category]}
      </h3>
      <div className="space-y-0.5">
        {tools.map((tool) => (
          <ToolItem key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

export function MainPage() {
  const [searchQuery, setSearchQuery] = useState(
    () => sessionStorage.getItem("devkithub-search") || "",
  );

  const updateSearch = (value: string) => {
    setSearchQuery(value);
    if (value) {
      sessionStorage.setItem("devkithub-search", value);
    } else {
      sessionStorage.removeItem("devkithub-search");
    }
  };
  const { items: newsItems, dismissed, dismiss } = useNewsItems();

  const filteredTools = useMemo(() => {
    if (!searchQuery) return allTools;

    const query = searchQuery.toLowerCase();
    return allTools.filter(
      (tool) =>
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const toolsByCategory = useMemo(() => {
    const grouped: Record<Category, Tool[]> = {
      "encode-decode": [],
      "data-conversion": [],
      "text-string": [],
      "code-formatting": [],
      development: [],
      security: [],
      media: [],
      utilities: [],
    };

    filteredTools.forEach((tool) => {
      grouped[tool.category].push(tool);
    });

    return grouped;
  }, [filteredTools]);

  const column1Categories: Category[] = ["encode-decode", "data-conversion"];
  const column2Categories: Category[] = ["text-string", "code-formatting"];
  const column3Categories: Category[] = ["development", "security"];
  const column4Categories: Category[] = ["media", "utilities"];

  const renderColumn = (cats: Category[]) => (
    <div>
      {cats.map((category) => (
        <CategorySection
          key={category}
          category={category}
          tools={toolsByCategory[category]}
        />
      ))}
    </div>
  );

  return (
    <ScrollArea className="h-full">
      <div className="min-h-full flex flex-col items-center">
        <div className="w-full max-w-4xl px-4 pt-6 pb-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                value={searchQuery}
                onChange={(e) => updateSearch(e.target.value)}
                type="text"
                placeholder={`Search among ${allTools.length} tools...`}
                className="block w-full pl-12 pr-10 py-2.5 border-2 border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              />
              {searchQuery && (
                <button
                  onClick={() => updateSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          {searchQuery && (
            <p className="mt-3 text-sm text-muted-foreground text-center">
              Found {filteredTools.length} tool
              {filteredTools.length !== 1 ? "s" : ""}
            </p>
          )}

          {newsItems.length > 0 && !dismissed && (
            <div className="mt-4 w-full max-w-2xl mx-auto">
              <NewsCarousel
                items={newsItems}
                onDismiss={dismiss}
              />
            </div>
          )}
        </div>

        <div className="w-full max-w-8xl pb-6 px-4">
          {filteredTools.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No tools found</h3>
              <p className="mt-1 text-muted-foreground">
                Try adjusting your search
              </p>
            </div>
          ) : (
            <div className="flex justify-center gap-6 flex-wrap">
              <div className="rounded-lg p-4 w-full max-w-xs">
                {renderColumn(column1Categories)}
              </div>
              <div className="rounded-lg p-4 w-full max-w-xs">
                {renderColumn(column2Categories)}
              </div>
              <div className="rounded-lg p-4 w-full max-w-xs">
                {renderColumn(column3Categories)}
              </div>
              <div className="rounded-lg p-4 w-full max-w-xs">
                {renderColumn(column4Categories)}
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
