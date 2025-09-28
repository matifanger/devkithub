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

export function AsciiToHexPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [format, setFormat] = useState('space');

  const convertAsciiToHex = useCallback(
    (ascii: string) => {
      try {
        if (!ascii.trim()) {
          setOutput('');
          setError('');
          return;
        }

        const hex = Array.from(ascii)
          .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
          .join(format === 'space' ? ' ' : '');

        setOutput(hex);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid ASCII string');
        setOutput('');
      }
    },
    [format]
  );

  const convertHexToAscii = useCallback(
    (hex: string) => {
      try {
        if (!hex.trim()) {
          setOutput('');
          setError('');
          return;
        }

        const cleanHex = hex.replace(format === 'space' ? /[^0-9A-Fa-f\s]/g : /[^0-9A-Fa-f]/g, '');
        const pairs = format === 'space' ? cleanHex.split(/\s+/) : cleanHex.match(/.{1,2}/g) || [];

        const ascii = pairs
          .map((pair) => {
            if (pair.length !== 2) {
              throw new Error('Invalid hex pair length');
            }
            const charCode = parseInt(pair, 16);
            if (isNaN(charCode)) {
              throw new Error('Invalid hex value');
            }
            return String.fromCharCode(charCode);
          })
          .join('');

        setOutput(ascii);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid hex string');
        setOutput('');
      }
    },
    [format]
  );

  const handleSample = () => {
    const sample = 'Hello World';
    setInput(sample);
    convertAsciiToHex(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      if (/^[0-9A-Fa-f\s]*$/.test(text)) {
        convertHexToAscii(text);
      } else {
        convertAsciiToHex(text);
      }
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
        <h1 className="text-2xl font-bold">ASCII to Hex Converter</h1>
        <p className="text-muted-foreground">Convert between ASCII text and hexadecimal</p>
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
                      <p className="text-sm text-muted-foreground">Configure hex format options</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Hex Format</Label>
                        <div className="col-span-2">
                          <Select
                            value={format}
                            onValueChange={(value) => {
                              setFormat(value);
                              if (/^[0-9A-Fa-f\s]*$/.test(input)) {
                                convertHexToAscii(input);
                              } else {
                                convertAsciiToHex(input);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="space">Space Separated</SelectItem>
                              <SelectItem value="continuous">Continuous</SelectItem>
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
                  setOutput('');
                  setError('');
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
                if (/^[0-9A-Fa-f\s]*$/.test(value)) {
                  convertHexToAscii(value);
                } else {
                  convertAsciiToHex(value);
                }
              }}
              placeholder="Enter ASCII text or hex"
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
                height="100%"
                className="h-[calc(100vh-17rem)]"
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
