import { json } from '@codemirror/lang-json';
import { php } from '@codemirror/lang-php';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import React, { useCallback, useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export function JsonToPhpPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const convertJsonToPhp = useCallback((jsonStr: string) => {
    try {
      if (!jsonStr.trim()) {
        setOutput('');
        setError('');
        return;
      }

      const data = JSON.parse(jsonStr);

      const convertValue = (value: unknown): string => {
        if (value === null) {
          return 'null';
        }

        switch (typeof value) {
          case 'string':
            return `'${value.replace(/'/g, "\\'")}'`;
          case 'number':
            return value.toString();
          case 'boolean':
            return value ? 'true' : 'false';
          case 'object':
            if (Array.isArray(value)) {
              const items = value.map((item) => convertValue(item)).join(', ');
              return `array(${items})`;
            } else {
              const items = Object.entries(value)
                .map(([key, val]) => `'${key}' => ${convertValue(val)}`)
                .join(',\n  ');
              return `array(\n  ${items}\n)`;
            }
          default:
            throw new Error(`Unsupported type: ${typeof value}`);
        }
      };

      const result = `(object) ${convertValue(data)}`;
      setOutput(result);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON input');
      setOutput('');
    }
  }, []);

  const handleSample = () => {
    const sample = JSON.stringify(
      {
        store: 'My Store',
        id: 123,
        active: true,
        products: ['Product 1', 'Product 2', 'Product 3'],
        settings: {
          currency: 'USD',
          tax_rate: 0.21,
          notifications: true,
        },
      },
      null,
      2
    );
    setInput(sample);
    convertJsonToPhp(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      convertJsonToPhp(text);
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
        <h1 className="text-2xl font-bold">JSON to PHP</h1>
        <p className="text-muted-foreground">Convert JSON to PHP array format</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>JSON Input</Label>
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
              theme={oneDark}
              extensions={[
                json(),
                EditorView.lineWrapping,
                EditorView.theme({
                  '&': {
                    backgroundColor: 'var(--background)',
                  },
                  '.cm-line': {
                    'word-wrap': 'break-word',
                    'white-space': 'pre-wrap',
                    'word-break': 'break-all',
                  },
                }),
              ]}
              onChange={(value) => {
                setInput(value);
                convertJsonToPhp(value);
              }}
              placeholder="Enter JSON"
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
            <Label>PHP Array Output</Label>
            <Button variant="outline" onClick={() => copyToClipboard(output)}>
              Copy
            </Button>
          </div>

          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
          ) : (
            <div className="h-[calc(100vh-17rem)]">
              <CodeMirror
                value={output}
                height="100%"
                className="h-[calc(100vh-17rem)]"
                theme={oneDark}
                extensions={[
                  php(),
                  EditorView.lineWrapping,
                  EditorView.theme({
                    '&': {
                      backgroundColor: 'var(--background)',
                    },
                    '.cm-line': {
                      'word-wrap': 'break-word',
                      'white-space': 'pre-wrap',
                      'word-break': 'break-all',
                    },
                  }),
                ]}
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
