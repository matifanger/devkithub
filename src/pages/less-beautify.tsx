import { less } from '@codemirror/lang-less';
import { css as beautifyCss } from 'js-beautify';
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

export function LessBeautifyPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [spaces, setSpaces] = useState('2');
  const [mode, setMode] = useState('beautify');

  const formatLess = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      if (mode === 'beautify') {
        const formatted = beautifyCss(input, {
          indent_size: Number(spaces),
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          end_with_newline: false,
          wrap_line_length: 0,
          indent_empty_lines: false,
        });
        setOutput(formatted);
      } else {
        // For minification
        const minified = input
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/\s*([:;,{}])\s*/g, '$1') // Remove spaces around operators
          .replace(/;}/, '}') // Remove unnecessary semicolons
          .trim();
        setOutput(minified);
      }

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid LESS');
      setOutput('');
    }
  }, [input, spaces, mode]);

  useEffect(() => {
    formatLess();
  }, [formatLess]);

  const handleSample = () => {
    const sample = `
// Variables
@primary-color: #3498db;
@secondary-color: #2ecc71;
@spacing: 20px;

// Mixins
.flex-center() {
    display: flex;
    justify-content: center;
    align-items: center;
}

// Styles
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: @spacing;
    
    .header {
        .flex-center();
        background-color: @primary-color;
        color: white;
        
        h1 {
            font-size: 2em;
            margin-bottom: @spacing;
        }
    }
    
    .content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: @spacing;
        
        .card {
            background-color: @secondary-color;
            padding: @spacing;
            border-radius: 8px;
            
            &:hover {
                transform: scale(1.05);
                transition: transform 0.3s ease;
            }
        }
    }
}

// Button styles
.button {
    .flex-center();
    padding: @spacing/2 @spacing;
    background-color: @primary-color;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    &--secondary {
        &:extend(.button);
        background-color: @secondary-color;
    }
}`;
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
        <h1 className="text-2xl font-bold">LESS Beautify/Minify</h1>
        <p className="text-muted-foreground">Format or minify your LESS code</p>
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
              extensions={[less()]}
              placeholder="Paste your LESS here"
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
                extensions={[less()]}
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
