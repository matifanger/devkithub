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
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function UrlEncoderDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');

  const handleProcess = (text: string, mode: string) => {
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(text));
      } else {
        setOutput(decodeURIComponent(text));
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
    const sample = 'Hello, World!';
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
        title="URL Encoder/Decoder"
        description="Convert text to and from URL encoding"
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
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encode">Encode</SelectItem>
                  <SelectItem value="decode">Decode</SelectItem>
                </SelectContent>
              </Select>
            </ToolToolbar>
          }
          heightClass="h-[200px]"
        >
          <Card className="relative p-4 h-full">
            <AppCodeMirror
              value={input}
              height="100%"
              width="100%"
              onChange={(value) => {
                setInput(value);
                handleProcess(value, mode);
              }}
              extensions={[javascript()]}
              placeholder={
                mode === 'encode' ? 'Enter text to encode' : 'Enter URL encoded text to decode'
              }
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </Card>
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
          heightClass="h-[200px]"
        >
          <Card className="relative p-4 h-full">
            <AppCodeMirror
              value={output}
              height="100%"
              width="100%"
              extensions={[javascript()]}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
              }}
            />
          </Card>
        </ToolEditorPanel>
      </ToolEditorGrid>
    </ToolPageContainer>
  );
}
