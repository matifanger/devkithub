import { json } from '@codemirror/lang-json';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import yaml from 'js-yaml';
import { JSONPath } from 'jsonpath-plus';
import React, { useCallback, useEffect, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { ToolCopyButton, ToolClearButton } from '../components/tool-actions';
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolEditorGrid,
  ToolErrorBanner,
} from '../components/tool-page-layout';
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

export function YamlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [jsonPath, setJsonPath] = useState('');
  const [spaces, setSpaces] = useState('2');

  const convertToJson = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      const parsed = yaml.load(input) as unknown;
      let result: unknown = parsed;

      if (jsonPath.trim()) {
        try {
          result = JSONPath({ path: jsonPath, json: parsed as object });
          if (!Array.isArray(result) && typeof result !== 'object') {
            result = [result];
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
      setError(err instanceof Error ? err.message : 'Invalid YAML');
      setOutput('');
    }
  }, [input, spaces, jsonPath]);

  useEffect(() => {
    convertToJson();
  }, [convertToJson]);

  const handleSample = () => {
    const sample = `store:
  book:
    - category: reference
      author: Nigel Rees
      title: Sayings of the Century
      price: 8.95
    - category: fiction
      author: Evelyn Waugh
      title: Sword of Honour
      price: 12.99`;
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

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="YAML to JSON Converter"
        description="Convert YAML format to JSON with formatting options"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="Input YAML"
          actions={
            <>
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <ToolClearButton onClear={() => setInput('')} />
            </>
          }
        >
          <AppCodeMirror
            value={input}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            width="100%"
            onChange={(value) => setInput(value)}
            extensions={[yamlLang()]}
            placeholder="Paste your YAML here"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <div className="space-y-2">
          <ToolEditorPanel
            label="JSON Output"
            actions={
            <>
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
              <ToolCopyButton value={output} />
            </>
          }
        >
          {error ? (
            <ToolErrorBanner error={error} />
          ) : (
            <AppCodeMirror
                value={output}
                className="h-[calc(100vh-17rem)]"
                height="100%"
                width="100%"
                extensions={[json()]}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                }}
              />
          )}
          </ToolEditorPanel>
          <div className="space-y-2 mt-4">
            <Label htmlFor="jsonpath" spellCheck={false}>
              JSONPath Query
            </Label>
            <Input
              id="jsonpath"
              value={jsonPath}
              onChange={(e) => setJsonPath(e.target.value)}
              placeholder="JSONPath: (e.g., $.store.book[*].author)"
              className="font-mono"
            />
          </div>
        </div>
      </ToolEditorGrid>
    </ToolPageContainer>
  );
}
