import React, { useState, ChangeEvent } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';

export function RegexTesterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');

  const handleProcess = (text: string, mode: string) => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(text));
      } else {
        setOutput(atob(text));
      }
    } catch (e) {
      setOutput('Invalid input for selected operation');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    handleProcess(e.target.value, mode);
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    handleProcess(input, newMode);
  };

  const handleSample = () => {
    const sample = 'Hello, World!';
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
        <h1 className="text-2xl font-bold">Regex Tester (TODO)</h1>
        <p className="text-muted-foreground">Test your regex</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Input</Label>
            <div className="flex items-center gap-4">
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
          </div>

          <Card className="p-4">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder={mode === 'encode' ? 'Enter text to encode' : 'Enter base64 to decode'}
              className="min-h-[200px] font-mono"
            />
          </Card>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Output</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(output)}>
                Copy
              </Button>
              <Button variant="outline" onClick={handleUseAsInput}>
                Use as Input
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <Textarea
              value={output}
              readOnly
              className="min-h-[200px] font-mono bg-muted"
            />
          </Card>
        </div>
      </div>
    </div>
  );
} 