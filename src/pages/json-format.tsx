import { json } from '@codemirror/lang-json';
import { EditorView } from '@uiw/react-codemirror';
import { JSONPath } from 'jsonpath-plus';
import React, { useCallback, useEffect, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function JsonFormatPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [jsonPath, setJsonPath] = useState('');
  const [spaces, setSpaces] = useState('2');

  const formatJson = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      const parsed = JSON.parse(input);
      let result = parsed;

      if (jsonPath.trim()) {
        try {
          result = JSONPath({ path: jsonPath, json: parsed });
          if (!Array.isArray(result) && typeof result !== 'object') {
            result = [result]; // Wrap primitive values in array
          }
        } catch (pathErr) {
          setError('Invalid JSONPath query');
          setOutput('');
          return;
        }
      }

      const formatted = JSON.stringify(result, null, Number(spaces));
      setOutput(formatted);

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setOutput('');
    }
  }, [input, spaces, jsonPath]);

  useEffect(() => {
    formatJson();
  }, [formatJson]);

  const handleSample = () => {
    const sample = {
      store: {
        book: [
          {
            category: 'reference',
            author: 'Nigel Rees',
            title: 'Sayings of the Century',
            price: 8.95,
          },
          {
            category: 'fiction',
            author: 'Evelyn Waugh',
            title: 'Sword of Honour',
            price: 12.99,
          },
          {
            category: 'fiction',
            author: 'Herman Melville',
            title: 'Moby Dick',
            price: 8.99,
            isbn: '0-553-21311-3',
          },
          {
            category: 'fiction',
            author: 'J. R. R. Tolkien',
            title: 'The Lord of the Rings',
            price: 22.99,
            isbn: '0-395-19395-8',
          },
          {
            category: 'science',
            author: 'Stephen Hawking',
            title: 'A Brief History of Time',
            price: 15.0,
          },
          {
            category: 'history',
            author: 'Yuval Noah Harari',
            title: 'Sapiens: A Brief History of Humankind',
            price: 18.5,
          },
          {
            category: 'biography',
            author: 'Walter Isaacson',
            title: 'Steve Jobs',
            price: 20.0,
          },
        ],
        magazine: [
          {
            title: 'National Geographic',
            issue: 'March 2021',
            price: 5.99,
          },
          {
            title: 'Scientific American',
            issue: 'April 2021',
            price: 6.5,
          },
        ],
        music: [
          {
            artist: 'Pink Floyd',
            album: 'The Dark Side of the Moon',
            price: 10.99,
          },
          {
            artist: 'The Beatles',
            album: 'Abbey Road',
            price: 12.5,
          },
        ],
      },
    };

    setInput(JSON.stringify(sample));
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
        <h1 className="text-2xl font-bold">JSON Format/Validate</h1>
        <p className="text-muted-foreground">Format and validate your JSON data</p>
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
              className="h-[calc(100vh-17rem)] text-base"
              height="100%"
              width="100%"
              onChange={(value) => setInput(value)}
              extensions={[json(), EditorView.lineWrapping]}
              placeholder="Paste your JSON here"
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
            <Label>Formatted Output</Label>
            <div className="flex items-center space-x-2">
              <Select value={spaces} onValueChange={setSpaces}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Spaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Spaces</SelectItem>
                  <SelectItem value="3">3 Spaces</SelectItem>
                  <SelectItem value="4">4 Spaces</SelectItem>
                  <SelectItem value="8">8 Spaces</SelectItem>
                </SelectContent>
              </Select>
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
                className="h-[calc(100vh-17rem)] text-base"
                height="100%"
                width="100%"
                extensions={[json(), EditorView.lineWrapping]}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                }}
              />
            </div>
          )}

          <div className="space-y-2 mt-4">
            <Label htmlFor="jsonpath">JSONPath Query</Label>
            <Input
              id="jsonpath"
              value={jsonPath}
              onChange={(e) => setJsonPath(e.target.value)}
              placeholder="JSONPath: (e.g., $.store.book[*].author)"
              className="font-mono"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
