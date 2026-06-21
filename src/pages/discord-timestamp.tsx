/**
 * Discord Timestamp Generator
 *
 * Generate Discord-compatible dynamic timestamps with timezone support.
 *
 * Features:
 * - All Discord timestamp formats (t, T, d, D, f, F, R)
 * - Timezone-aware conversion
 * - Quick date presets (1h, 1d, 1w, 1m from now)
 * - Live preview of all format variants
 * - Copy individual timestamps or all at once
 * - Current time display with auto-update
 * - Persistent state
 *
 * How to use:
 * 1. Select a date and time using the inputs
 * 2. Choose your timezone
 * 3. Copy the generated timestamp
 * 4. Paste it in Discord - it renders dynamically for each user
 */
import { format as formatDate } from "date-fns";
import { getTimezoneOffset, toZonedTime } from "date-fns-tz";
import { Calendar, Clock, Copy, Check } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { ToolCopyButton, ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
} from "../components/tool-page-layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToolState } from "../hooks/useToolState";

const TIMESTAMP_FORMATS: Record<string, string> = {
  t: "Short Time",
  T: "Long Time",
  d: "Short Date",
  D: "Long Date",
  f: "Short Date/Time",
  F: "Long Date/Time",
  R: "Relative",
};

const ALL_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

type TimezoneType = (typeof ALL_TIMEZONES)[number];

interface DiscordTimestampState {
  dateStr: string;
  timeStr: string;
  format: string;
  timezone: string;
}

const now = new Date();
const initialState: DiscordTimestampState = {
  dateStr: formatDate(now, "yyyy-MM-dd"),
  timeStr: formatDate(now, "HH:mm"),
  format: "f",
  timezone: (() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return ALL_TIMEZONES.includes(tz as TimezoneType) ? tz : "UTC";
    } catch {
      return "UTC";
    }
  })(),
};

function formatTzDisplay(tz: string) {
  const offsetMs = getTimezoneOffset(tz);
  const hours = Math.floor(Math.abs(offsetMs) / 3600000);
  const mins = Math.floor((Math.abs(offsetMs) % 3600000) / 60000);
  const sign = offsetMs >= 0 ? "+" : "-";
  const offset = mins > 0 ? `${hours}:${String(mins).padStart(2, "0")}` : `${hours}`;
  return `${tz.replace(/_/g, " ")} (UTC${sign}${offset})`;
}

function InlineCopy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 1200);
      return () => clearTimeout(t);
    }
  }, [copied]);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        if (window.electron?.showCopyToast) void window.electron.showCopyToast(value);
      }}
      className="p-1.5 rounded hover:bg-muted transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

export function DiscordTimestampPage() {
  const [state, setState, clearState] = useToolState("discord-timestamp", initialState);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const selectedDate = useMemo(() => {
    const [y, m, d] = state.dateStr.split("-").map(Number);
    const [h, min] = state.timeStr.split(":").map(Number);
    return new Date(y, m - 1, d, h, min);
  }, [state.dateStr, state.timeStr]);

  const unixTimestamp = useMemo(() => {
    const tzOffset = getTimezoneOffset(state.timezone);
    return Math.floor((selectedDate.getTime() - tzOffset) / 1000);
  }, [selectedDate, state.timezone]);

  const allFormats = useMemo(
    () =>
      Object.entries(TIMESTAMP_FORMATS).map(([key, label]) => ({
        key,
        label,
        code: `<t:${unixTimestamp}:${key}>`,
      })),
    [unixTimestamp],
  );

  const currentFormatCode = `<t:${unixTimestamp}:${state.format}>`;

  const formatInTimezone = (d: Date) => {
    const zonedDate = toZonedTime(d, state.timezone);
    return formatDate(zonedDate, "PPp");
  };

  const setNow = () => {
    const n = new Date();
    setState((prev) => ({
      ...prev,
      dateStr: formatDate(n, "yyyy-MM-dd"),
      timeStr: formatDate(n, "HH:mm"),
    }));
  };

  const setPreset = (offsetMs: number) => {
    const d = new Date(Date.now() + offsetMs);
    setState((prev) => ({
      ...prev,
      dateStr: formatDate(d, "yyyy-MM-dd"),
      timeStr: formatDate(d, "HH:mm"),
    }));
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Discord Timestamp Generator"
        description="Generate dynamic timestamps for Discord messages with timezone support"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary animate-pulse shrink-0" />
                <span className="text-sm text-muted-foreground leading-tight">Now:</span>
                <span className="text-sm font-mono font-medium leading-tight">
                  {formatInTimezone(currentTime)}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={setNow} className="shrink-0 ml-2">
                Use Now
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={state.dateStr}
                  onChange={(e) => setState((p) => ({ ...p, dateStr: e.target.value }))}
                  className="font-mono h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Time</Label>
                <Input
                  type="time"
                  value={state.timeStr}
                  onChange={(e) => setState((p) => ({ ...p, timeStr: e.target.value }))}
                  className="font-mono h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Timezone</Label>
                <Select
                  value={state.timezone}
                  onValueChange={(v) => setState((p) => ({ ...p, timezone: v }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz} className="text-xs">
                        {formatTzDisplay(tz)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Format</Label>
                <Select
                  value={state.format}
                  onValueChange={(v) => setState((p) => ({ ...p, format: v }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIMESTAMP_FORMATS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreset(3600000)}>
                +1h
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreset(86400000)}>
                +1d
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreset(604800000)}>
                +1w
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreset(2592000000)}>
                +1mo
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreset(31536000000)}>
                +1y
              </Button>
              <ToolClearButton onClear={() => clearState()} />
            </div>

            <div className="p-4 rounded-lg bg-[#36393f] border border-[#40444b]">
              <p className="text-sm text-[#dcddde] font-mono break-all">
                {currentFormatCode}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <ToolCopyButton value={currentFormatCode} label="Copy" />
                <span className="text-xs text-[#72767d]">
                  Paste this in Discord
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">All Formats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {allFormats.map(({ key, label, code }) => (
              <div
                key={key}
                className={`flex items-center justify-between p-2.5 rounded-md transition-colors ${
                  key === state.format ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xs font-mono truncate">{code}</p>
                </div>
                <InlineCopy value={code} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ToolPageContainer>
  );
}
