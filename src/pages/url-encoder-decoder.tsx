import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import 'prismjs/components/prism-markup';

export function UrlEncoderDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');
  const [highlightedInput, setHighlightedInput] = useState('');
  const [highlightedOutput, setHighlightedOutput] = useState('');

  useEffect(() => {
    const highlighted = Prism.highlight(
      input,
      Prism.languages.markup,
      'markup'
    );
    setHighlightedInput(highlighted);

    const highlightedOut = Prism.highlight(
      output,
      Prism.languages.markup,
      'markup'
    );
    setHighlightedOutput(highlightedOut);
  }, [input, output]);

  const handleProcess = (text: string, mode: string) => {
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(text));
      } else {
        setOutput(decodeURIComponent(text));
      }
    } catch (e) {
      setOutput('Invalid input for selected operation');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInput(text);
    handleProcess(text, mode);
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    handleProcess(input, newMode);
  };

  const handleSample = () => {
    const sample = 'Hello, World!';
    handleInputChange({ target: { value: sample } } as ChangeEvent<HTMLTextAreaElement>);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleInputChange({ target: { value: text } } as ChangeEvent<HTMLTextAreaElement>);
    } catch (err) {
      console.error('Failed to read from clipboard');
    }
  };

  const handleUseAsInput = () => {
    handleInputChange({ target: { value: output } } as ChangeEvent<HTMLTextAreaElement>);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">URL Encoder/Decoder</h1>
        <p className="text-muted-foreground">Convert text to and from URL encoding</p>
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
                <Button variant="outline" onClick={() => handleInputChange({ target: { value: '' } } as ChangeEvent<HTMLTextAreaElement>)}>
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
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder={mode === 'encode' ? 'Enter text to encode' : 'Enter base64 to decode'}
              className="min-h-[200px] font-mono bg-[#272822] text-transparent caret-white text-white relative z-10"
              spellCheck="false"
            />
            <pre className="min-h-[200px] font-mono overflow-auto absolute inset-4 z-0">
              <code 
                className="language-markup"
                dangerouslySetInnerHTML={{ __html: highlightedInput || ' ' }}
              />
            </pre>
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
            <Textarea
              value={output}
              readOnly
              className="min-h-[200px] font-mono bg-[#272822] text-transparent caret-white text-white relative z-10"
              spellCheck="false"
            />
            <pre className="min-h-[200px] font-mono overflow-auto absolute inset-4 z-0">
              <code 
                className="language-markup"
                dangerouslySetInnerHTML={{ __html: highlightedOutput || ' ' }}
              />
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
} 