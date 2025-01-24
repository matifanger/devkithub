import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { CopyButton } from '../components/ui/copy-button';

function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 1) return '0 sec ago';
  if (diff < 60) return `${Math.floor(diff)} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} weeks ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const TIME_UNITS = [
  { label: '1 hour', seconds: 3600 },
  { label: '1 day', seconds: 86400 },
  { label: '1 week', seconds: 604800 },
  { label: '1 month (30.44 days)', seconds: 2629743 },
  { label: '1 year (365.24 days)', seconds: 31556926 },
];

const CODE_EXAMPLES = [
  { language: 'JavaScript', code: 'Math.floor(new Date().getTime()/1000.0)' },
  { language: 'Python', code: 'import time; time.time()' },
  { language: 'PHP', code: 'time()' },
  { language: 'Java', code: 'System.currentTimeMillis()/1000' },
  { language: 'SQL', code: 'SELECT unix_timestamp(now())' },
  { language: 'C#', code: 'DateTimeOffset.Now.ToUnixTimeSeconds()' },
];

export function UnixTimePage() {
  const [unixTime, setUnixTime] = useState('');
  const [humanDate, setHumanDate] = useState('');
  const [currentUnix, setCurrentUnix] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentUnix(Math.floor(now.getTime() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const convertToHuman = () => {
    try {
      const date = new Date(parseInt(unixTime) * 1000);
      setHumanDate(date.toISOString());
    } catch (err) {
      setHumanDate('Invalid Unix timestamp');
    }
  };

  const TimeDisplay = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between p-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono">{value}</span>
        <CopyButton value={value} src={label} />
      </div>
    </div>
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      convertToHuman();
    }
  };

  return (
    <div className="container mx-auto p-6 pb-12 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Unix Time Converter and Analysis</h1>
        <p className="text-muted-foreground">High-precision Unix timestamp analysis and conversion utility</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg">Timestamp Analysis</CardTitle>
            <CardDescription>Enter Unix timestamp for comprehensive temporal analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unix">Unix Timestamp (seconds since epoch)</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="unix"
                  value={unixTime}
                  onChange={(e) => setUnixTime(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter Unix timestamp (e.g., 1625731200)"
                  className="font-mono flex-1"
                />
                <Button onClick={convertToHuman} className="sm:w-auto w-full">Analyze</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const now = new Date();
                  setUnixTime(Math.floor(now.getTime() / 1000).toString());
                  convertToHuman();
                }}
                className="h-auto py-2"
              >
                <div className="flex flex-col items-center">
                  <span>Current Time</span>
                  <span className="text-xs opacity-70">({currentUnix})</span>
                </div>
              </Button>
              <Button 
                className='h-full'
                variant="outline" 
                onClick={() => {
                  setUnixTime('0');
                  convertToHuman();
                }}
              >
                Unix Epoch (0)
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const time = 1000000000;
                  setUnixTime(time.toString());
                  convertToHuman();
                }}
                className="h-auto py-2"
              >
                <div className="flex flex-col items-center">
                  <span>1 Billion</span>
                  <span className="text-xs opacity-70">(2001-09-09)</span>
                </div>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const time = 2000000000;
                  setUnixTime(time.toString());
                  convertToHuman();
                }}
                className="h-auto py-2"
              >
                <div className="flex flex-col items-center">
                  <span>2 Billion</span>
                  <span className="text-xs opacity-70">(2033-05-18)</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg">What is Unix Epoch Time?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              The Unix epoch (or Unix time or POSIX time or Unix timestamp) is the number of seconds that have elapsed since January 1, 1970 (midnight UTC/GMT), not counting leap seconds (in ISO 8601: 1970-01-01T00:00:00Z).
            </p>
            <p>
              Some systems store epoch dates as a signed 32-bit integer, which might cause problems on January 19, 2038 (known as the Year 2038 problem or Y2038).
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold">Common Time Units in Seconds:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TIME_UNITS.map(({ label, seconds }) => (
                  <div key={label} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span>{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{seconds}</span>
                      <CopyButton value={seconds.toString()} src={label} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {humanDate && !humanDate.includes('Invalid') && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Temporal Analysis</CardTitle>
              <CardDescription>Comprehensive timestamp breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <TimeDisplay 
                label="Unix timestamp" 
                value={unixTime} 
              />
              <TimeDisplay 
                label="ISO 8601 (UTC)" 
                value={humanDate} 
              />
              <TimeDisplay 
                label="Local date & time" 
                value={new Date(humanDate).toLocaleString()} 
              />
              <TimeDisplay 
                label="UTC string" 
                value={new Date(humanDate).toUTCString()} 
              />
              <TimeDisplay 
                label="Relative time" 
                value={formatRelativeTime(parseInt(unixTime))} 
              />
              <TimeDisplay 
                label="Day of year" 
                value={getDayOfYear(new Date(humanDate)).toString()} 
              />
              <TimeDisplay 
                label="Week of year" 
                value={getWeekNumber(new Date(humanDate)).toString()} 
              />
              <TimeDisplay 
                label="Is leap year" 
                value={isLeapYear(new Date(humanDate).getFullYear()).toString()} 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alternative Formats</CardTitle>
              <CardDescription>Format variations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <TimeDisplay 
                label="Milliseconds since epoch" 
                value={(parseInt(unixTime) * 1000).toString()} 
              />
              <TimeDisplay 
                label="Full date" 
                value={new Date(humanDate).toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} 
              />
              <TimeDisplay 
                label="ISO date only" 
                value={humanDate.split('T')[0]} 
              />
              <TimeDisplay 
                label="ISO time only" 
                value={humanDate.split('T')[1]} 
              />
              <TimeDisplay 
                label="24-hour time" 
                value={new Date(humanDate).toLocaleTimeString(undefined, {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })} 
              />
              <TimeDisplay 
                label="12-hour time" 
                value={new Date(humanDate).toLocaleTimeString(undefined, {
                  hour12: true,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })} 
              />
              <TimeDisplay 
                label="Timezone" 
                value={Intl.DateTimeFormat().resolvedOptions().timeZone} 
              />
              <TimeDisplay 
                label="Timezone offset" 
                value={`UTC${new Date(humanDate).toTimeString().slice(9, 17)}`} 
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Code Examples</CardTitle>
          <CardDescription>Get current Unix timestamp in different languages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {CODE_EXAMPLES.map(({ language, code }) => (
              <div key={language} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <span className="font-semibold min-w-[80px]">{language}</span>
                <div className="flex items-center gap-2 overflow-x-auto">
                  <code className="font-mono text-sm whitespace-nowrap">{code}</code>
                  <CopyButton value={code} src={language} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 