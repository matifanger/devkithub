import { html } from '@codemirror/lang-html';
import { html as beautify } from 'js-beautify';
import React, { useCallback, useEffect, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function HtmlBeautifyPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [spaces, setSpaces] = useState('2');
  const [mode, setMode] = useState('beautify');

  const formatHtml = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      if (mode === 'beautify') {
        const formatted = beautify(input, {
          indent_size: Number(spaces),
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          indent_scripts: 'keep',
          end_with_newline: false,
          wrap_line_length: 0,
          indent_inner_html: false,
          indent_empty_lines: false,
        });
        setOutput(formatted);
      } else {
        // Minify: remove all unnecessary whitespace
        const minified = input.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
        setOutput(minified);
      }

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid HTML');
      setOutput('');
    }
  }, [input, spaces, mode]);

  useEffect(() => {
    formatHtml();
  }, [formatHtml]);

  const handleSample = () => {
    const sample = `<!DOCTYPE html><html><head><title>Sample Page</title></head><body><div class="container"><h1>Hello World</h1><p>This is a sample HTML document</p></div></body></html>`;
    setInput(sample.trim());
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
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
        <h1 className="text-2xl font-bold">HTML Beautify/Minify</h1>
        <p className="text-muted-foreground">Format or minify your HTML code</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
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
              <Button variant="outline" onClick={() => setInput('')}>
                Clear
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              onChange={(value) => setInput(value)}
              extensions={[html()]}
              placeholder="Paste your HTML here"
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
            <div className="flex items-center space-x-2">
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beautify">Beautify</SelectItem>
                  <SelectItem value="minify">Minify</SelectItem>
                </SelectContent>
              </Select>
              {mode === 'beautify' && (
                <Select value={spaces} onValueChange={setSpaces}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Spaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Spaces</SelectItem>
                    <SelectItem value="4">4 Spaces</SelectItem>
                    <SelectItem value="8">8 Spaces</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" onClick={() => copyToClipboard(output)}>
                Copy
              </Button>
            </div>
          </div>

          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
          ) : (
            <div className="h-[calc(100vh-17rem)]">
              <AppCodeMirror
                value={output}
                className="h-[calc(100vh-17rem)]"
                height="100%"
                width="100%"
                extensions={[html()]}
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
