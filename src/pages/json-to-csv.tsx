import { json } from '@codemirror/lang-json';
import { Settings } from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useState } from 'react';
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
import { Label } from '../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function JsonToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [quotes, setQuotes] = useState('true');

  const convertJsonToCsv = useCallback(
    (value: string, newDelimiter = delimiter, newQuotes = quotes) => {
      try {
        if (!value.trim()) {
          setOutput('');
          setError('');
          return;
        }

        const data = JSON.parse(value);
        if (!Array.isArray(data)) {
          throw new Error('Input must be an array of objects');
        }

        const csv = Papa.unparse(data, {
          delimiter: newDelimiter,
          quotes: newQuotes === 'true',
        });

        setOutput(csv);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON');
        setOutput('');
      }
    },
    [delimiter, quotes]
  );

  const handleSample = () => {
    const sample = [
      {
        name: 'John Doe',
        age: 30,
        city: 'New York',
        country: 'USA',
      },
      {
        name: 'Jane Smith',
        age: 25,
        city: 'London',
        country: 'UK',
      },
      {
        name: 'Bob Johnson',
        age: 35,
        city: 'Paris',
        country: 'France',
      },
    ];
    const sampleStr = JSON.stringify(sample, null, 2);
    setInput(sampleStr);
    convertJsonToCsv(sampleStr);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      convertJsonToCsv(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="JSON to CSV Converter"
        description="Convert JSON array to CSV format"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="Input JSON"
          actions={
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure CSV generation options
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Delimiter</Label>
                        <div className="col-span-2">
                          <Select
                            value={delimiter}
                            onValueChange={(value) => {
                              setDelimiter(value);
                              convertJsonToCsv(input, value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Delimiter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value=",">Comma (,)</SelectItem>
                              <SelectItem value=";">Semicolon (;)</SelectItem>
                              <SelectItem value="\t">Tab</SelectItem>
                              <SelectItem value="|">Pipe (|)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Quote fields</Label>
                        <div className="col-span-2">
                          <Select
                            value={quotes}
                            onValueChange={(value) => {
                              setQuotes(value);
                              convertJsonToCsv(input, delimiter, value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Quotes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <ToolClearButton onClear={handleClear} />
            </>
          }
        >
          <AppCodeMirror
            value={input}
            className="h-[calc(100vh-17rem)]"
            extensions={[json()]}
            height="100%"
            onChange={(value) => {
              setInput(value);
              convertJsonToCsv(value);
            }}
            placeholder="Paste your JSON array here"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="Output CSV"
          actions={<ToolCopyButton value={output} />}
        >
          {error ? (
            <ToolErrorBanner error={error} />
          ) : (
            <AppCodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
              }}
            />
          )}
        </ToolEditorPanel>
      </ToolEditorGrid>
    </ToolPageContainer>
  );
}
