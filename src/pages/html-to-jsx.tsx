import React, { useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

export function HtmlToJsxPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const convertHtmlToJsx = useCallback((html: string) => {
    try {
      if (!html.trim()) {
        setOutput('');
        setError('');
        return;
      }

      // Basic HTML to JSX conversion rules
      const jsx = html
        // Convert class to className
        .replace(/class=/g, 'className=')
        // Convert for to htmlFor
        .replace(/for=/g, 'htmlFor=')
        // Convert style strings to objects
        .replace(/style="([^"]*)"/g, (match: string, styles: string) => {
          const styleObject = styles
            .split(';')
            .filter(Boolean)
            .map((style: string) => {
              const [property, value] = style.split(':').map((s: string) => s.trim());
              // Convert kebab-case to camelCase
              const camelProperty = property.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
              return `${camelProperty}: "${value}"`;
            })
            .join(', ');
          return `style={{${styleObject}}}`;
        })
        // Self-closing tags
        .replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>]*?)>/g, '<$1$2 />')
        // Convert inline event handlers
        .replace(/on([a-z]+)="([^"]*)"/gi, (match, event, handler) => {
          return `on${event.charAt(0).toUpperCase() + event.slice(1)}={() => ${handler}}`;
        });

      setOutput(jsx);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid HTML');
      setOutput('');
    }
  }, []);

  const handleSample = () => {
    const sample = `<div class="container">
  <h1 class="title" style="color: blue; font-size: 24px;">
    Hello World
  </h1>
  <label for="name">Name:</label>
  <input type="text" id="name" class="input" />
  <button onclick="handleClick()">
    Click me
  </button>
  <img src="image.jpg" alt="Sample image">
</div>`;
    setInput(sample.trim());
    convertHtmlToJsx(sample.trim());
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      convertHtmlToJsx(text);
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
        <h1 className="text-2xl font-bold">HTML to JSX Converter</h1>
        <p className="text-muted-foreground">Convert HTML code to JSX format</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Input HTML</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <Button variant="outline" onClick={() => {
                setInput('');
                setOutput('');
                setError('');
              }}>
                Clear
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <CodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              theme={oneDark}
              extensions={[html()]}
              onChange={(value) => {
                setInput(value);
                convertHtmlToJsx(value);
              }}
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
            <Label>Output JSX</Label>
            <Button variant="outline" onClick={() => copyToClipboard(output)}>
              Copy
            </Button>
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
                theme={oneDark}
                extensions={[javascript({ jsx: true })]}
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
