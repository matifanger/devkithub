import * as Popover from '@radix-ui/react-popover';
import { format as formatDate } from 'date-fns';
import { getTimezoneOffset, toZonedTime } from 'date-fns-tz';
import { CalendarIcon, Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const TIMESTAMP_FORMATS = {
  t: 'Short Time (1:23 PM)',
  T: 'Long Time (1:23:00 PM)',
  d: 'Short Date (01/01/2024)',
  D: 'Long Date (January 1, 2024)',
  f: 'Short Date/Time (January 1, 2024 1:23 PM)',
  F: 'Long Date/Time (Monday, January 1, 2024 1:23 PM)',
  R: 'Relative Time (2 hours ago)',
} as const;

type TimezoneType = (typeof ALL_TIMEZONES)[number];

// Get all available timezones
const ALL_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

const EXAMPLE_DATES = [
  { label: '1 Hour From Now', date: new Date(Date.now() + 3600000) },
  { label: '1 Day From Now', date: new Date(Date.now() + 86400000) },
  { label: '1 Week From Now', date: new Date(Date.now() + 604800000) },
  { label: '1 Month From Now', date: new Date(Date.now() + 2592000000) },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const formatTimezoneDisplay = (tz: string) => {
  const now = new Date();
  const offsetMinutes = getTimezoneOffset(tz) / (60 * 1000); // Convert ms to minutes
  const hours = Math.abs(Math.floor(offsetMinutes / 60));
  const sign = offsetMinutes >= 0 ? '+' : '-';
  return `${tz.replace('_', ' ')} (UTC${sign}${hours})`;
};

export function DiscordTimestampPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [timestampFormat, setTimestampFormat] = useState<keyof typeof TIMESTAMP_FORMATS>('f');
  const [timezone, setTimezone] = useState<TimezoneType>(() => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return ALL_TIMEZONES.includes(userTimezone as TimezoneType)
        ? (userTimezone as TimezoneType)
        : 'UTC';
    } catch {
      return 'UTC';
    }
  });
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const generateTimestamp = (inputDate: Date = date) => {
    const tzOffset = getTimezoneOffset(timezone);
    const timestamp = Math.floor((inputDate.getTime() - tzOffset) / 1000);
    return `<t:${timestamp}:${timestampFormat}>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateTimestamp());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setCurrentDateTime = () => {
    setDate(new Date());
  };

  const formatInTimezone = (dateToFormat: Date) => {
    const zonedDate = toZonedTime(dateToFormat, timezone);
    return formatDate(zonedDate, 'PPp');
  };

  return (
    <div className="container mx-auto p-6 space-y-8 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Discord Timestamp Generator</h1>
        <p className="text-muted-foreground">
          Generate timestamps for Discord messages with timezone support
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Button
                variant="outline"
                onClick={setCurrentDateTime}
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Use Current Time
              </Button>
              <div className="text-sm">
                <span className="text-muted-foreground">Current:</span>{' '}
                <span className="font-medium">{formatInTimezone(currentTime)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-lg">Date Selection</Label>
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left h-12">
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      <span className="font-medium">{formatDate(date, 'PPP')}</span>
                    </Button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content className="bg-popover p-6 rounded-xl shadow-xl" sideOffset={4}>
                      <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: 31 }, (_, i) => {
                          const day = new Date(date.getFullYear(), date.getMonth(), i + 1);
                          return (
                            <Button
                              key={i}
                              variant={day.getDate() === date.getDate() ? 'default' : 'ghost'}
                              className={`h-10 w-10 p-0 font-medium ${
                                day.getDate() === date.getDate()
                                  ? 'hover:bg-primary hover:text-primary-foreground'
                                  : ''
                              }`}
                              onClick={() => {
                                const newDate = new Date(date);
                                newDate.setDate(i + 1);
                                setDate(newDate);
                              }}
                            >
                              {i + 1}
                            </Button>
                          );
                        })}
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>

              <div className="space-y-2">
                <Label className="text-lg">Time Selection</Label>
                <Popover.Root open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
                  <Popover.Trigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left h-12">
                      <Clock className="mr-2 h-5 w-5" />
                      <span className="font-medium">{formatDate(date, 'HH:mm')}</span>
                    </Button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="bg-popover p-4 rounded-xl shadow-xl w-[300px]"
                      sideOffset={4}
                    >
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                          <Label>Hours</Label>
                          <div className="h-[200px] overflow-auto rounded-md bg-background">
                            {HOURS.map((hour) => (
                              <button
                                key={hour}
                                className={`w-full px-4 py-2 text-left hover:bg-accent ${
                                  hour === date.getHours()
                                    ? 'bg-primary text-primary-foreground'
                                    : ''
                                }`}
                                onClick={() => {
                                  const newDate = new Date(date);
                                  newDate.setHours(hour);
                                  setDate(newDate);
                                }}
                              >
                                {hour.toString().padStart(2, '0')}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Minutes</Label>
                          <div className="h-[200px] overflow-auto rounded-md bg-background">
                            {MINUTES.map((minute) => (
                              <button
                                key={minute}
                                className={`w-full px-4 py-2 text-left hover:bg-accent ${
                                  minute === date.getMinutes()
                                    ? 'bg-primary text-primary-foreground'
                                    : ''
                                }`}
                                onClick={() => {
                                  const newDate = new Date(date);
                                  newDate.setMinutes(minute);
                                  setDate(newDate);
                                  setTimePopoverOpen(false);
                                }}
                              >
                                {minute.toString().padStart(2, '0')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>

              <div className="space-y-2">
                <Label className="text-lg">Timezone</Label>
                <Select
                  value={timezone}
                  onValueChange={(value) => setTimezone(value as TimezoneType)}
                >
                  <SelectTrigger className="w-full h-12 inline-flex items-center justify-between rounded-md bg-background px-4 py-2 text-base focus:outline-none">
                    <SelectValue>{formatTimezoneDisplay(timezone)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_TIMEZONES.map((tz) => (
                      <SelectItem
                        key={tz}
                        value={tz}
                        className="relative flex cursor-pointer select-none items-center rounded-lg py-3 px-6 text-base outline-none hover:bg-accent data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                      >
                        {formatTimezoneDisplay(tz)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-lg">Format Style</Label>
                <Select
                  value={timestampFormat}
                  onValueChange={(value: keyof typeof TIMESTAMP_FORMATS) =>
                    setTimestampFormat(value)
                  }
                >
                  <SelectTrigger className="w-full h-12 inline-flex items-center justify-between rounded-md bg-background px-4 py-2 text-base focus:outline-none">
                    <SelectValue>{TIMESTAMP_FORMATS[timestampFormat]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-popover rounded-xl shadow-xl overflow-hidden">
                    {Object.entries(TIMESTAMP_FORMATS).map(([key, description]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="relative flex cursor-pointer select-none items-center rounded-lg py-3 px-6 text-base outline-none hover:bg-accent data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                      >
                        {description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-lg">Generated Timestamp</Label>
                <div className="flex gap-2">
                  <Input
                    value={generateTimestamp()}
                    readOnly
                    className="font-mono text-base h-12"
                  />
                  <Button onClick={copyToClipboard} className="h-12 px-6">
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {EXAMPLE_DATES.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-between h-12 px-4"
                  onClick={() => setDate(example.date)}
                >
                  <span className="font-medium">{example.label}</span>
                  <span className="text-muted-foreground">{formatInTimezone(example.date)}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-mono break-all text-base">{generateTimestamp()}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">All Formats</h3>
                <div className="space-y-3">
                  {Object.entries(TIMESTAMP_FORMATS).map(([key, description]) => (
                    <div
                      key={key}
                      className="grid grid-cols-2 gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-muted-foreground">{description}</div>
                      <div className="font-mono">{`<t:${Math.floor((date.getTime() - getTimezoneOffset(timezone)) / 1000)}:${key}>`}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Note: The actual timestamp will be rendered by Discord when you paste it in a
                  message. Times are converted to UTC before generating the timestamp.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
