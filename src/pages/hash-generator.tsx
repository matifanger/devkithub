import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
// Use crypto-browserify
// import crypto from 'crypto-browserify';

export function HashGeneratorPage() {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState('md5');
  const [hash, setHash] = useState('');

  const generateHash = () => {
    // const hasher = crypto.createHash(algorithm);
    // hasher.update(input);
    // setHash(hasher.digest('hex'));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Hash Generator</h1>
        <p className="text-muted-foreground">Generate hash from text using different algorithms</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="input">Input Text</Label>
          <Input
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash"
          />
        </div>

        <div className="space-y-2">
          <Label>Algorithm</Label>
          <Select value={algorithm} onValueChange={setAlgorithm}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="md5">MD5</SelectItem>
              <SelectItem value="sha1">SHA1</SelectItem>
              <SelectItem value="sha256">SHA256</SelectItem>
              <SelectItem value="sha512">SHA512</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={generateHash} className="w-full">Generate Hash</Button>

        {hash && (
          <div className="space-y-2">
            <Label>Generated Hash</Label>
            <div className="p-4 bg-muted rounded-lg break-all font-mono">
              {hash}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 