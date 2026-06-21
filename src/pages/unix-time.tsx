import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Copy, Check, ArrowRightLeft, Calendar, Globe, Code2, Zap } from 'lucide-react';
import { ToolCopyButton } from '../components/tool-actions';
import {
  ToolPageContainer,
  ToolPageHeader,
} from '../components/tool-page-layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';

function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  const abs = Math.abs(diff);
  const suffix = diff >= 0 ? 'ago' : 'from now';

  if (abs < 1) return 'just now';
  if (abs < 60) return `${Math.floor(abs)}s ${suffix}`;
  if (abs < 3600) return `${Math.floor(abs / 60)}m ${suffix}`;
  if (abs < 86400) return `${Math.floor(abs / 3600)}h ${suffix}`;
  if (abs < 604800) return `${Math.floor(abs / 86400)}d ${suffix}`;
  if (abs < 2592000) return `${Math.floor(abs / 604800)}w ${suffix}`;
  if (abs < 31536000) return `${Math.floor(abs / 2592000)}mo ${suffix}`;
  return `${Math.floor(abs / 31536000)}y ${suffix}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const CODE_EXAMPLES = [
  { language: 'JavaScript', code: 'Math.floor(Date.now() / 1000)', color: 'text-yellow-400' },
  { language: 'Python', code: 'import time; int(time.time())', color: 'text-blue-400' },
  { language: 'PHP', code: 'time()', color: 'text-purple-400' },
  { language: 'Java', code: 'System.currentTimeMillis() / 1000', color: 'text-orange-400' },
  { language: 'C#', code: 'DateTimeOffset.Now.ToUnixTimeSeconds()', color: 'text-green-400' },
  { language: 'Go', code: 'time.Now().Unix()', color: 'text-cyan-400' },
  { language: 'Rust', code: 'SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs()', color: 'text-red-400' },
  { language: 'SQL', code: 'SELECT UNIX_TIMESTAMP(NOW())', color: 'text-sky-400' },
];

function InlineCopyButton({ value }: { value: string }) {
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
        if (window.electron?.showCopyToast) {
          void window.electron.showCopyToast(value);
        }
      }}
      className="ml-2 p-1 rounded hover:bg-muted transition-colors shrink-0"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors group">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-mono text-sm">{value}</span>
        <InlineCopyButton value={value} />
      </div>
    </div>
  );
}

export function UnixTimePage() {
  const [unixInput, setUnixInput] = useState('');
  const [humanInput, setHumanInput] = useState('');
  const [currentUnix, setCurrentUnix] = useState(Math.floor(Date.now() / 1000));
  const [analysisTimestamp, setAnalysisTimestamp] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUnix(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const convertUnixToHuman = useCallback(() => {
    const parsed = parseInt(unixInput);
    if (!isNaN(parsed)) {
      setAnalysisTimestamp(parsed);
    }
  }, [unixInput]);

  const convertHumanToUnix = useCallback(() => {
    const date = new Date(humanInput);
    if (!isNaN(date.getTime())) {
      const unix = Math.floor(date.getTime() / 1000);
      setAnalysisTimestamp(unix);
      setUnixInput(unix.toString());
    }
  }, [humanInput]);

  const useNow = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    setUnixInput(now.toString());
    setAnalysisTimestamp(now);
  }, []);

  const analysisDate = useMemo(() => {
    if (analysisTimestamp === null) return null;
    return new Date(analysisTimestamp * 1000);
  }, [analysisTimestamp]);

  const digits = currentUnix.toString().split('');

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Unix Time Converter"
        description="Convert, analyze, and explore Unix timestamps with precision"
      />

      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Current Unix Timestamp</p>
                <div className="flex items-center gap-0.5 mt-1">
                  {digits.map((digit, i) => (
                    <span
                      key={`${i}-${digit}`}
                      className="inline-flex items-center justify-center w-7 h-9 bg-background rounded font-mono text-lg font-bold border shadow-sm"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <ToolCopyButton value={currentUnix.toString()} label="Copy" />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="unix-to-human" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unix-to-human" className="gap-2">
            <Zap className="h-3.5 w-3.5" />
            Unix → Human
          </TabsTrigger>
          <TabsTrigger value="human-to-unix" className="gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Human → Unix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unix-to-human">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unix-input">Unix Timestamp (seconds)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="unix-input"
                      value={unixInput}
                      onChange={(e) => setUnixInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && convertUnixToHuman()}
                      placeholder="e.g. 1625731200"
                      className="font-mono flex-1"
                    />
                    <Button onClick={convertUnixToHuman}>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Convert
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={useNow}>
                    Now
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setUnixInput('0'); setAnalysisTimestamp(0); }}>
                    Epoch (0)
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setUnixInput('1000000000'); setAnalysisTimestamp(1000000000); }}>
                    1 Billion
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setUnixInput('2000000000'); setAnalysisTimestamp(2000000000); }}>
                    2 Billion
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setUnixInput('2147483647'); setAnalysisTimestamp(2147483647); }}>
                    Max 32-bit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="human-to-unix">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="human-input">Date & Time</Label>
                  <div className="flex gap-2">
                    <Input
                      id="human-input"
                      type="datetime-local"
                      value={humanInput}
                      onChange={(e) => setHumanInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && convertHumanToUnix()}
                      className="font-mono flex-1"
                    />
                    <Button onClick={convertHumanToUnix}>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Convert
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    const now = new Date();
                    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    setHumanInput(local);
                    setAnalysisTimestamp(Math.floor(now.getTime() / 1000));
                    setUnixInput(Math.floor(now.getTime() / 1000).toString());
                  }}>
                    Now
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setHumanInput('2000-01-01T00:00');
                    setAnalysisTimestamp(946684800);
                    setUnixInput('946684800');
                  }}>
                    Y2K
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setHumanInput('2038-01-19T03:14');
                    setAnalysisTimestamp(2147483647);
                    setUnixInput('2147483647');
                  }}>
                    Y2038
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {analysisDate && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Temporal Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5">
              <ResultRow label="Unix Timestamp" value={analysisTimestamp!.toString()} />
              <Separator />
              <ResultRow label="ISO 8601 (UTC)" value={analysisDate.toISOString()} />
              <ResultRow label="Local Date & Time" value={analysisDate.toLocaleString()} />
              <ResultRow label="UTC String" value={analysisDate.toUTCString()} />
              <ResultRow label="Relative" value={formatRelativeTime(analysisTimestamp!)} />
              <Separator />
              <ResultRow label="Day of Year" value={getDayOfYear(analysisDate).toString()} />
              <ResultRow label="Week of Year" value={getWeekNumber(analysisDate).toString()} />
              <ResultRow label="Leap Year" value={isLeapYear(analysisDate.getFullYear()) ? 'Yes' : 'No'} />
              <ResultRow label="Day of Week" value={analysisDate.toLocaleDateString(undefined, { weekday: 'long' })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                Format Variations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5">
              <ResultRow label="Milliseconds" value={(analysisTimestamp! * 1000).toString()} />
              <ResultRow label="Microseconds" value={(analysisTimestamp! * 1000000).toString()} />
              <Separator />
              <ResultRow
                label="Full Date"
                value={analysisDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
              <ResultRow label="Date Only" value={analysisDate.toISOString().split('T')[0]} />
              <ResultRow label="Time Only" value={analysisDate.toISOString().split('T')[1]} />
              <Separator />
              <ResultRow
                label="24h Time"
                value={analysisDate.toLocaleTimeString(undefined, {
                  hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              />
              <ResultRow
                label="12h Time"
                value={analysisDate.toLocaleTimeString(undefined, {
                  hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              />
              <ResultRow label="Timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />
              <ResultRow
                label="UTC Offset"
                value={`UTC${analysisDate.toTimeString().slice(9, 17)}`}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            Get Current Timestamp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {CODE_EXAMPLES.map(({ language, code, color }) => (
              <div
                key={language}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-transparent hover:border-border transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-xs font-bold uppercase tracking-wider ${color} w-[70px] shrink-0`}>
                    {language}
                  </span>
                  <code className="font-mono text-xs truncate">{code}</code>
                </div>
                <InlineCopyButton value={code} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold font-mono">{currentUnix}</p>
              <p className="text-xs text-muted-foreground mt-1">Seconds since Jan 1, 1970</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{currentUnix * 1000}</p>
              <p className="text-xs text-muted-foreground mt-1">Milliseconds since epoch</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{(2147483647 - currentUnix).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Seconds until Y2038</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolPageContainer>
  );
}
