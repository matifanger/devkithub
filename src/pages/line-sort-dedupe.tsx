import { Settings } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function LineSortDedupePage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [caseSensitive, setCaseSensitive] = useState('true');
  const [dedupe, setDedupe] = useState('true');
  const [trim, setTrim] = useState('true');

  const processLines = useCallback(
    (
      text: string,
      newSortOrder = sortOrder,
      newCaseSensitive = caseSensitive,
      newDedupe = dedupe,
      newTrim = trim
    ) => {
      try {
        if (!text.trim()) {
          setOutput('');
          setError('');
          return;
        }

        // Split into lines and optionally trim
        let lines = text.split('\n');
        if (newTrim === 'true') {
          lines = lines.map((line) => line.trim());
        }

        // Remove empty lines
        lines = lines.filter((line) => line.length > 0);

        // Deduplicate if enabled
        if (newDedupe === 'true') {
          lines = Array.from(new Set(lines));
        }

        // Sort lines
        lines.sort((a, b) => {
          if (newCaseSensitive === 'false') {
            a = a.toLowerCase();
            b = b.toLowerCase();
          }
          if (newSortOrder === 'asc') {
            return a.localeCompare(b);
          } else if (newSortOrder === 'desc') {
            return b.localeCompare(a);
          } else {
            // Random sort using Fisher-Yates shuffle
            return Math.random() - 0.5;
          }
        });

        setOutput(lines.join('\n'));
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error processing lines');
        setOutput('');
      }
    },
    [sortOrder, caseSensitive, dedupe, trim]
  );

  const handleSample = () => {
    const sample = `
Line 3
line 1
Line 2
line 2
LINE 1
line 3
Line 1
  Line with spaces  
Line 2
Empty lines above and below

line 3`;
    const trimmedSample = sample.trim();
    setInput(trimmedSample);
    processLines(trimmedSample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      processLines(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Line Sort & Dedupe</h1>
        <p className="text-muted-foreground">Sort and deduplicate text lines</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Label>Input</Label>
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
                        Configure sorting and deduplication options
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Sort Order</Label>
                        <div className="col-span-2">
                          <Select
                            value={sortOrder}
                            onValueChange={(value) => {
                              setSortOrder(value);
                              processLines(input, value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sort Order" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Ascending</SelectItem>
                              <SelectItem value="desc">Descending</SelectItem>
                              <SelectItem value="random">Random</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Case Sensitive</Label>
                        <div className="col-span-2">
                          <Select
                            value={caseSensitive}
                            onValueChange={(value) => {
                              setCaseSensitive(value);
                              processLines(input, sortOrder, value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Case" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Deduplicate</Label>
                        <div className="col-span-2">
                          <Select
                            value={dedupe}
                            onValueChange={(value) => {
                              setDedupe(value);
                              processLines(input, sortOrder, caseSensitive, value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Dedupe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Trim Lines</Label>
                        <div className="col-span-2">
                          <Select
                            value={trim}
                            onValueChange={(value) => {
                              setTrim(value);
                              processLines(input, sortOrder, caseSensitive, dedupe, value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Trim" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
              <Button
                variant="outline"
                onClick={() => {
                  setInput('');
                  processLines('');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              onChange={(value) => {
                setInput(value);
                processLines(value);
              }}
              placeholder="Enter text to sort and deduplicate"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Output</Label>
            <Button variant="outline" onClick={() => copyToClipboard(output)}>
              Copy
            </Button>
          </div>

          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
          ) : (
            <div className="h-[calc(100vh-17rem)]">
              <AppCodeMirror
                value={output}
                className="h-[calc(100vh-17rem)]"
                height="100%"
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
