import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import yaml from 'js-yaml';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export function JsonToYamlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indentation, setIndentation] = useState('2');

  const convertToYaml = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      const parsed = JSON.parse(input);
      const formatted = yaml.dump(parsed, {
        indent: Number(indentation),
        lineWidth: -1,
        noRefs: true,
      });
      setOutput(formatted);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setOutput('');
    }
  }, [input, indentation]);

  useEffect(() => {
    convertToYaml();
  }, [convertToYaml]);

  const handleSample = () => {
    const sample = JSON.stringify({
      store: {
        book: [
          {
            category: "reference",
            author: "Nigel Rees",
            title: "Sayings of the Century",
            price: 8.95
          },
          {
            category: "fiction",
            author: "Evelyn Waugh",
            title: "Sword of Honour",
            price: 12.99
          }
        ]
      }
    }, null, 2);
    setInput(sample);
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
        <h1 className="text-2xl font-bold">JSON to YAML Converter</h1>
        <p className="text-muted-foreground">Convert JSON format to YAML with formatting options</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="input">Input JSON</Label>
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
              extensions={[json()]}
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
            <Label>YAML Output</Label>
            <div className="flex items-center space-x-2">
              <Select value={indentation} onValueChange={setIndentation}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Indentation" />
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
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          ) : (
            <CodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              theme={oneDark}
              extensions={[yamlLang()]}
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