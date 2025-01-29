import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { js as beautifyJs } from 'js-beautify';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export function JsBeautifyPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [spaces, setSpaces] = useState('2');
  const [mode, setMode] = useState('beautify');

  const formatJs = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      if (mode === 'beautify') {
        const formatted = beautifyJs(input, {
          indent_size: Number(spaces),
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          keep_array_indentation: false,
          break_chained_methods: false,
          brace_style: 'collapse',
          space_before_conditional: true,
          unescape_strings: false,
          jslint_happy: false,
          end_with_newline: false,
          wrap_line_length: 0,
          comma_first: false,
          e4x: false,
          indent_empty_lines: false
        });
        setOutput(formatted);
      } else {
        // For minification, we'll use a simple regex-based approach
        // Note: For production use, you might want to use a proper minifier like Terser
        const minified = input
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/\s*([:;,{}()[\]])\s*/g, '$1') // Remove spaces around operators
          .replace(/;\}/g, '}') // Remove unnecessary semicolons
          .trim();
        setOutput(minified);
      }
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JavaScript');
      setOutput('');
    }
  }, [input, spaces, mode]);

  useEffect(() => {
    formatJs();
  }, [formatJs]);

  const handleSample = () => {
    const sample = `
// Sample JavaScript code
function calculateTotal(items) {
    let total = 0;
    
    // Loop through items
    for (const item of items) {
        total += item.price * item.quantity;
    }
    
    // Apply discount if total is over 100
    if (total > 100) {
        total = total * 0.9;  // 10% discount
    }
    
    return total;
}

const items = [
    { name: 'Book', price: 29.99, quantity: 2 },
    { name: 'Pen', price: 4.99, quantity: 5 },
    { name: 'Notebook', price: 9.99, quantity: 3 }
];

console.log('Total:', calculateTotal(items));`;
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
        <h1 className="text-2xl font-bold">JavaScript Beautify/Minify</h1>
        <p className="text-muted-foreground">Format or minify your JavaScript code</p>
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
            <CodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              theme={oneDark}
              onChange={(value) => setInput(value)}
              extensions={[javascript()]}
              placeholder="Paste your JavaScript here"
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
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          ) : (
            <div className="h-[calc(100vh-17rem)]">
              <CodeMirror
                value={output}
                className="h-[calc(100vh-17rem)]"
                height="100%"
                width="100%"
                theme={oneDark}
                extensions={[javascript()]}
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
