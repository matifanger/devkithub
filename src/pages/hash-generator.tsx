import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CopyButton } from '../components/ui/copy-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { FileText } from 'lucide-react';

interface HashOutputs {
  md2: string;
  md4: string;
  md5: string;
  sha1: string;
  sha224: string;
  sha256: string;
  sha384: string;
  sha512: string;
  'sha3-224': string;
  'sha3-256': string;
  'sha3-384': string;
  'sha3-512': string;
  ripemd160: string;
  whirlpool: string;
  'blake2b': string;
  'blake2s': string;
  'blake3': string;
  sm3: string;
}

export function HashGeneratorPage() {
  const [input, setInput] = useState('');
  const [casing, setCasing] = useState('lowercase');
  const [hashes, setHashes] = useState<HashOutputs>({
    md2: '',
    md4: '',
    md5: '',
    sha1: '',
    sha224: '',
    sha256: '',
    sha384: '',
    sha512: '',
    'sha3-224': '',
    'sha3-256': '',
    'sha3-384': '',
    'sha3-512': '',
    ripemd160: '',
    whirlpool: '',
    'blake2b': '',
    'blake2s': '',
    'blake3': '',
    sm3: ''
  });

  const generateHashes = async (text: string, newCasing = casing) => {
    // If the input is empty, clear all hashes
    if (!text.trim()) {
      setHashes({
        md2: '',
        md4: '',
        md5: '',
        sha1: '',
        sha224: '',
        sha256: '',
        sha384: '',
        sha512: '',
        'sha3-224': '',
        'sha3-256': '',
        'sha3-384': '',
        'sha3-512': '',
        ripemd160: '',
        whirlpool: '',
        'blake2b': '',
        'blake2s': '',
        'blake3': '',
        sm3: ''
      });
      return;
    }

    const algorithms = [
      'md2', 'md4', 'md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512',
      'sha3-224', 'sha3-256', 'sha3-384', 'sha3-512',
      'ripemd160', 'whirlpool', 'blake2b', 'blake2s', 'blake3', 'sm3'
    ];
    const newHashes: Partial<HashOutputs> = {};

    await Promise.all(
      algorithms.map(async (algo) => {
        try {
          const hash = await window.cryptoAPI.hash(algo, text);
          if (hash) {
            newHashes[algo as keyof HashOutputs] = newCasing === 'lowercase' ? hash.toLowerCase() : hash.toUpperCase();
          } else {
            newHashes[algo as keyof HashOutputs] = '';
          }
        } catch (e) {
          newHashes[algo as keyof HashOutputs] = '';
        }
      })
    );

    setHashes(newHashes as HashOutputs);
  };

  const handleSample = () => {
    const sample = 'Hello, World!';
    setInput(sample);
    generateHashes(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      generateHashes(text);
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
          generateHashes(text);
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
        <div className="space-y-2">
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
              <Button variant="outline" onClick={() => {
                setInput('');
                generateHashes('');
              }}>
                Clear
              </Button>
            </div>
          </div>

          <CodeMirror
            value={input}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            width="100%"
            theme={oneDark}
            onChange={(value) => {
              setInput(value);
              generateHashes(value);
            }}
            extensions={[javascript()]}
            placeholder="Enter text to hash"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              Total bytes: {new TextEncoder().encode(input).length}
            </div>
            <Select value={casing} onValueChange={(value) => {
              setCasing(value);
              // Instantly update hashes with new casing
              const newHashes: HashOutputs = {} as HashOutputs;
              Object.entries(hashes).forEach(([algo, hash]) => {
                newHashes[algo as keyof HashOutputs] = value === 'lowercase' ? hash.toLowerCase() : hash.toUpperCase();
              });
              setHashes(newHashes);
            }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lowercase">lowercase</SelectItem>
                <SelectItem value="uppercase">UPPERCASE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 h-[calc(100vh-17rem)] border p-4 overflow-auto">
            {!input.trim() ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <p className="text-center">Enter some text to generate hashes</p>
              </div>
            ) : (
              Object.entries(hashes).map(([algo, hash]) => (
                <div key={algo} className="space-y-2">
                  <Label className="uppercase">{algo}</Label>
                  <div className="flex gap-2">
                    <Input value={hash} readOnly className="font-mono bg-muted flex-1" />
                    <CopyButton value={hash} src={algo} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 