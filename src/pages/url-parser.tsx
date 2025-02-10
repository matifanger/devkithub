import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Settings, Copy } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';

interface URLComponents {
  href: string;
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  params: Record<string, string>;
}

interface Settings {
  decodeComponents: boolean;
  showCredentials: boolean;
  parseIPv6: boolean;
  normalizeProtocol: boolean;
  displayFormat: 'parsed' | 'json' | 'curl' | 'fetch';
}

export function UrlParserPage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<Settings>({
    decodeComponents: true,
    showCredentials: false,
    parseIPv6: true,
    normalizeProtocol: true,
    displayFormat: 'parsed'
  });

  const validateUrl = useCallback((input: string): boolean => {
    if (!input) return true;
    try {
      new URL(input);
      setError('');
      return true;
    } catch (e) {
      setError('Invalid URL format. Please enter a valid URL (e.g., https://example.com)');
      return false;
    }
  }, []);

  const parseUrl = useCallback((input: string): URLComponents | null => {
    if (!input || !validateUrl(input)) return null;
    try {
      const parsed = new URL(input);
      const params: Record<string, string> = {};
      parsed.searchParams.forEach((value, key) => {
        params[key] = settings.decodeComponents ? decodeURIComponent(value) : value;
      });

      return {
        href: parsed.href,
        protocol: settings.normalizeProtocol ? parsed.protocol.replace(':', '') : parsed.protocol,
        username: settings.showCredentials ? parsed.username : '',
        password: settings.showCredentials ? parsed.password : '',
        host: parsed.host,
        hostname: parsed.hostname,
        port: parsed.port,
        pathname: settings.decodeComponents ? decodeURIComponent(parsed.pathname) : parsed.pathname,
        search: parsed.search,
        hash: settings.decodeComponents ? decodeURIComponent(parsed.hash) : parsed.hash,
        origin: parsed.origin,
        params
      };
    } catch (e) {
      return null;
    }
  }, [settings, validateUrl]);

  const parsedUrl = useMemo(() => parseUrl(url), [url, parseUrl]);

  const generateCurl = useCallback((components: URLComponents): string => {
    let curl = 'curl';
    if (settings.showCredentials && components.username) {
      curl += ` -u "${components.username}:${components.password}"`;
    }
    curl += ` "${components.href}"`;
    return curl;
  }, [settings]);

  const generateFetch = useCallback((components: URLComponents): string => {
    let options = '';
    if (settings.showCredentials && components.username) {
      options = `,\n  headers: {\n    "Authorization": "Basic ${btoa(`${components.username}:${components.password}`)}\n  }"`;
    }
    return `fetch("${components.href}"${options})`;
  }, [settings]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSample = () => {
    const sample = 'https://user:pass@api.example.com:8080/path/to/resource?key1=value1&key2=value2&complex=%7B%22nested%22%3A%22value%22%7D#section-1';
    setUrl(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      console.error('Failed to read from clipboard');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">URL Parser</h1>
        <p className="text-muted-foreground">
          Parse, analyze, and format URLs. Supports complex URLs with authentication, query parameters, and fragments.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Label>Input URL</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Settings</h4>
                        <p className="text-sm text-muted-foreground">
                          Configure URL parsing options
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="decode">Decode Components</Label>
                          <Switch
                            id="decode"
                            checked={settings.decodeComponents}
                            onCheckedChange={(checked) =>
                              setSettings(prev => ({ ...prev, decodeComponents: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="credentials">Show Credentials</Label>
                          <Switch
                            id="credentials"
                            checked={settings.showCredentials}
                            onCheckedChange={(checked) =>
                              setSettings(prev => ({ ...prev, showCredentials: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="ipv6">Parse IPv6</Label>
                          <Switch
                            id="ipv6"
                            checked={settings.parseIPv6}
                            onCheckedChange={(checked) =>
                              setSettings(prev => ({ ...prev, parseIPv6: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="protocol">Normalize Protocol</Label>
                          <Switch
                            id="protocol"
                            checked={settings.normalizeProtocol}
                            onCheckedChange={(checked) =>
                              setSettings(prev => ({ ...prev, normalizeProtocol: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={handleClipboardPaste}>
                  Clipboard
                </Button>
                <Button variant="outline" onClick={handleSample}>
                  Sample
                </Button>
                <Button variant="outline" onClick={() => setUrl('')}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <Input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  validateUrl(e.target.value);
                }}
                placeholder="Enter URL (e.g., https://user:pass@example.com:8080/path?query=123#hash)"
                className="font-mono"
              />
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parsedUrl && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>URL Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">Component</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="w-[80px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(parsedUrl).map(([key, value]) => {
                        if (key === 'params') return null;
                        if (!settings.showCredentials && (key === 'username' || key === 'password')) return null;
                        return (
                          <TableRow key={key}>
                            <TableCell className="font-mono font-medium">{key}</TableCell>
                            <TableCell className="font-mono truncate max-w-[300px]">{value || '(empty)'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(value)}
                                className="h-8 w-8 p-0 hover:bg-muted"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Query Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(parsedUrl.params).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Parameter</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="w-[80px] text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(parsedUrl.params).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell className="font-mono font-medium">{key}</TableCell>
                            <TableCell className="font-mono truncate max-w-[300px]">{value}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(value)}
                                className="h-8 w-8 p-0 hover:bg-muted"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">No query parameters found</p>
                  )}
                </CardContent>
              </Card>

              <div className="md:col-span-2 space-y-4">
                <h2 className="text-lg font-semibold">Other Formats</h2>

                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>JSON Format</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(JSON.stringify(parsedUrl, null, 2))}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CodeMirror
                        value={JSON.stringify(parsedUrl, null, 2)}
                        height="200px"
                        theme={oneDark}
                        extensions={[javascript({ jsx: true })]}
                        editable={false}
                        basicSetup={{
                          lineNumbers: true,
                          foldGutter: true,
                          highlightActiveLine: false,
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>cURL Command</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(generateCurl(parsedUrl))}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CodeMirror
                        value={generateCurl(parsedUrl)}
                        height="100px"
                        theme={oneDark}
                        editable={false}
                        basicSetup={{
                          lineNumbers: true,
                          foldGutter: true,
                          highlightActiveLine: false,
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Fetch API</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(generateFetch(parsedUrl))}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CodeMirror
                        value={generateFetch(parsedUrl)}
                        height="100px"
                        theme={oneDark}
                        extensions={[javascript({ jsx: true })]}
                        editable={false}
                        basicSetup={{
                          lineNumbers: true,
                          foldGutter: true,
                          highlightActiveLine: false,
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 