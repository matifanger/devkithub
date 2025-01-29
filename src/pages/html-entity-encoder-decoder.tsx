import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card } from '../components/ui/card';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';

export function HtmlEntityEncoderDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');

  const encodeHTML = (str: string) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  const decodeHTML = (str: string) => {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || '';
  };

  const handleProcess = (text: string, mode: string) => {
    try {
      if (mode === 'encode') {
        setOutput(encodeHTML(text));
      } else {
        setOutput(decodeHTML(text));
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
    const sample = '<div class="example">Hello & World!</div>';
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
        <h1 className="text-2xl font-bold">HTML Entity Encoder/Decoder</h1>
        <p className="text-muted-foreground">Convert text to and from HTML entity encoding</p>
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
            <CodeMirror
              value={input}
              height="200px"
              width="100%"
              theme={oneDark}
              onChange={(value) => {
                setInput(value);
                handleProcess(value, mode);
              }}
              extensions={[html()]}
              placeholder={mode === 'encode' ? 'Enter text to encode' : 'Enter HTML entities to decode'}
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
            <CodeMirror
              value={output}
              height="200px"
              width="100%"
              theme={oneDark}
              extensions={[html()]}
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