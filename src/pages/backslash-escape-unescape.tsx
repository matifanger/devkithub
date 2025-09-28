import { javascript } from '@codemirror/lang-javascript';
import React, { useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function BackslashEscapeUnescapePage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');

  const escapeBackslash = (str: string) => {
    return str.replace(/[\\n\rt"']/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '\\': '\\\\',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '"': '\\"',
        "'": "\\'",
      };
      return escapeMap[match] || match;
    });
  };

  const unescapeBackslash = (str: string) => {
    return str.replace(/\\(\\|n|r|t|"|')/g, (match, p1) => {
      const unescapeMap: { [key: string]: string } = {
        '\\': '\\',
        n: '\n',
        r: '\r',
        t: '\t',
        '"': '"',
        "'": "'",
      };
      return unescapeMap[p1] || match;
    });
  };

  const handleProcess = (text: string, mode: string) => {
    try {
      if (mode === 'encode') {
        setOutput(escapeBackslash(text));
      } else {
        setOutput(unescapeBackslash(text));
      }
    } catch (e) {
      setOutput('Invalid input for selected operation');
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    handleProcess(input, newMode);
  };

  const handleSample = () => {
    const sample = 'Hello\nWorld!\t"Special" chars: \\ and \'quote\'';
    setInput(sample);
    handleProcess(sample, mode);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      handleProcess(text, mode);
    } catch (err) {
      console.error('Failed to read from clipboard');
    }
  };

  const handleUseAsInput = () => {
    setInput(output);
    handleProcess(output, mode);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Backslash Escape/Unescape</h1>
        <p className="text-muted-foreground">Convert text to and from backslash escaping</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Label className="mr-4">Input:</Label>
              <div className="space-x-2">
                <Button variant="outline" onClick={handleClipboardPaste}>
                  Clipboard
                </Button>
                <Button variant="outline" onClick={handleSample}>
                  Sample
                </Button>
                <Button variant="outline" onClick={() => setInput('')}>
                  Clear
                </Button>
              </div>
            </div>
            <Select value={mode} onValueChange={handleModeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="encode">Encode</SelectItem>
                <SelectItem value="decode">Decode</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="relative p-4">
            <AppCodeMirror
              value={input}
              height="200px"
              width="100%"
              onChange={(value) => {
                setInput(value);
                handleProcess(value, mode);
              }}
              extensions={[javascript()]}
              placeholder={
                mode === 'encode'
                  ? 'Enter text to encode'
                  : 'Enter backslash escaped text to decode'
              }
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </Card>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Output:</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(output)}>
                Copy
              </Button>
              <Button variant="outline" onClick={handleUseAsInput}>
                Use as Input
              </Button>
            </div>
          </div>

          <Card className="relative p-4">
            <AppCodeMirror
              value={output}
              height="200px"
              width="100%"
              extensions={[javascript()]}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
