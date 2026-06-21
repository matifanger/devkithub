import { javascript } from '@codemirror/lang-javascript';
import React, { useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { ToolCopyButton, ToolClearButton } from '../components/tool-actions';
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolEditorGrid,
  ToolToolbar,
} from '../components/tool-page-layout';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function BackslashEscapeUnescapePage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');

  const escapeBackslash = (str: string) => {
    return str.replace(/[\\n\rt"']/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '\\': '\\\\',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '"': '\\"',
        "'": "\\'",
      };
      return escapeMap[match] || match;
    });
  };

  const unescapeBackslash = (str: string) => {
    return str.replace(/\\(\\|n|r|t|"|')/g, (match, p1) => {
      const unescapeMap: { [key: string]: string } = {
        '\\': '\\',
        n: '\n',
        r: '\r',
        t: '\t',
        '"': '"',
        "'": "'",
      };
      return unescapeMap[p1] || match;
    });
  };

  const handleProcess = (text: string, mode: string) => {
    try {
      if (mode === 'encode') {
        setOutput(escapeBackslash(text));
      } else {
        setOutput(unescapeBackslash(text));
      }
    } catch (e) {
      setOutput('Invalid input for selected operation');
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    handleProcess(input, newMode);
  };

  const handleSample = () => {
    const sample = 'Hello\nWorld!\t"Special" chars: \\ and \'quote\'';
    setInput(sample);
    handleProcess(sample, mode);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      handleProcess(text, mode);
    } catch (err) {
      console.error('Failed to read from clipboard');
    }
  };

  const handleUseAsInput = () => {
    setInput(output);
    handleProcess(output, mode);
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Backslash Escape/Unescape"
        description="Convert text to and from backslash escaping"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="Input:"
          actions={
            <ToolToolbar>
              <Button variant="outline" size="sm" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" size="sm" onClick={handleSample}>
                Sample
              </Button>
              <ToolClearButton onClear={() => setInput('')} />
              <Select value={mode} onValueChange={handleModeChange}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encode">Encode</SelectItem>
                  <SelectItem value="decode">Decode</SelectItem>
                </SelectContent>
              </Select>
            </ToolToolbar>
          }
        >
          <AppCodeMirror
            value={input}
            height="100%"
            width="100%"
            className="h-full"
            onChange={(value) => {
              setInput(value);
              handleProcess(value, mode);
            }}
            extensions={[javascript()]}
            placeholder={
              mode === 'encode'
                ? 'Enter text to encode'
                : 'Enter backslash escaped text to decode'
            }
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="Output:"
          actions={
            <ToolToolbar>
              <ToolCopyButton value={output} />
              <Button variant="outline" size="sm" onClick={handleUseAsInput}>
                Use as Input
              </Button>
            </ToolToolbar>
          }
        >
          <AppCodeMirror
            value={output}
            height="100%"
            width="100%"
            className="h-full"
            extensions={[javascript()]}
            editable={false}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: false,
            }}
          />
        </ToolEditorPanel>
      </ToolEditorGrid>
    </ToolPageContainer>
  );
}
