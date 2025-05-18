import { css } from '@codemirror/lang-css';
import { xml } from '@codemirror/lang-xml';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import React, { useCallback, useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export function CssToSvgPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const convertToSvg = useCallback((value: string) => {
    try {
      if (!value.trim()) {
        setOutput('');
        setError('');
        return;
      }

      // Extract background-image URL from CSS
      const match = value.match(/background-image:\s*url\(['"]?data:image\/svg\+xml,(.+?)['"]?\)/i);
      if (!match) {
        throw new Error('Invalid CSS. Expected background-image with SVG data URI.');
      }

      // Decode the SVG content
      const decodedSvg = decodeURIComponent(match[1]);
      setOutput(decodedSvg);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid CSS');
      setOutput('');
    }
  }, []);

  const handleSample = () => {
    const sample = `background-image: url("data:image/svg+xml,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 2L2 7L12 12L22 7L12 2Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 17L12 22L22 17' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 12L12 17L22 12' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>");`;
    setInput(sample);
    convertToSvg(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      convertToSvg(text);
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
        <h1 className="text-2xl font-bold">CSS to SVG Converter</h1>
        <p className="text-muted-foreground">
          Convert CSS background-image with data URI back to SVG code
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="input">Input CSS</Label>
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
            <CodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              theme={oneDark}
              onChange={(value) => {
                setInput(value);
                convertToSvg(value);
              }}
              extensions={[css(), EditorView.lineWrapping]}
              placeholder="Paste your CSS background-image code here"
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
            <Label>SVG Output</Label>
            <Button variant="outline" onClick={() => copyToClipboard(output)}>
              Copy
            </Button>
          </div>

          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
          ) : (
            <CodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              theme={oneDark}
              extensions={[xml(), EditorView.lineWrapping]}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
