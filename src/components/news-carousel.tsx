import React, { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  link?: string;
  date: string;
  type: "update" | "feature" | "announcement" | "tip";
}

interface NewsCarouselProps {
  items: NewsItem[];
  onDismiss?: () => void;
  className?: string;
}

const typeColors: Record<NewsItem["type"], string> = {
  update: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  feature: "bg-green-500/10 text-green-600 dark:text-green-400",
  announcement: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  tip: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

const typeLabels: Record<NewsItem["type"], string> = {
  update: "Update",
  feature: "New Feature",
  announcement: "Announcement",
  tip: "Tip",
};

export function NewsCarousel({
  items,
  onDismiss,
  className,
}: NewsCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [paused, items.length, next]);

  if (!items.length) return null;

  const item = items[current];

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card overflow-hidden",
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  typeColors[item.type],
                )}
              >
                {typeLabels[item.type]}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(item.date).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-sm font-semibold truncate">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
            {item.link && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.electron.openExternal(item.link!);
                }}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                Read more <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex gap-1">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === current
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={prev}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={next}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function useNewsItems() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Endpoint to be configured - for now returns empty
        // When ready, replace with actual API call:
        // const response = await axios.get(baseApiUrl + '/api/news');
        // setItems(response.data.items);
        setItems([]);
      } catch {
        setItems([]);
      }
      setLoading(false);
    };
    fetchNews();
  }, []);

  return { items, loading, dismissed, dismiss: () => setDismissed(true) };
}
