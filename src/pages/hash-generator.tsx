import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CopyButton } from '../components/ui/copy-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';

interface HashOutputs {
  md5: string;
  sha1: string;
  sha224: string;
  sha256: string;
  sha384: string;
  sha512: string;
}

export function HashGeneratorPage() {
  const [input, setInput] = useState('');
  const [casing, setCasing] = useState('lowercase');
  const [hashes, setHashes] = useState<HashOutputs>({
    md5: '',
    sha1: '',
    sha224: '',
    sha256: '',
    sha384: '',
    sha512: '',
  });

  const generateHashes = (text: string) => {
    const algorithms = ['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512'];
    const newHashes: Partial<HashOutputs> = {};

    algorithms.forEach(algo => {
      try {
        const hash = window.cryptoAPI.hash(algo, text);
        newHashes[algo as keyof HashOutputs] = casing === 'lowercase' ? hash : hash.toUpperCase();
      } catch (e) {
        newHashes[algo as keyof HashOutputs] = '';
      }
    });

    setHashes(newHashes as HashOutputs);
  };

  useEffect(() => {
    if (input) {
      generateHashes(input);
    }
  }, [input, casing]);

  const handleSample = () => {
    setInput('Hello, World!');
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error('Failed to read from clipboard');
    }
  };

  const handleFileLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setInput(text);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Hash Generator</h1>
        <p className="text-muted-foreground">Generate multiple hash formats from text input</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Input</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <Button variant="outline" onClick={handleFileLoad}>
                Load File...
              </Button>
              <Button variant="outline" onClick={() => setInput('')}>
                Clear
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <Textarea
              value={input}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              placeholder="Enter text to hash"
              className="min-h-[300px] font-mono bg-[#272822] text-white p-4"
            />
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              Total bytes: {new TextEncoder().encode(input).length}
            </div>
            <Select value={casing} onValueChange={setCasing}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lowercase">lowercase</SelectItem>
                <SelectItem value="uppercase">UPPERCASE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {Object.entries(hashes).map(([algo, hash]) => (
              <div key={algo} className="space-y-2">
                <Label className="uppercase">{algo}</Label>
                <div className="flex gap-2">
                  <Input value={hash} readOnly className="font-mono bg-muted flex-1" />
                  <CopyButton value={hash} src={algo} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 