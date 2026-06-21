import { html } from '@codemirror/lang-html';
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

export function HtmlEntityEncoderDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');

  const encodeHTML = (str: string) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  const decodeHTML = (str: string) => {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || '';
  };

  const handleProcess = (text: string, mode: string) => {
    try {
      if (mode === 'encode') {
        setOutput(encodeHTML(text));
      } else {
        setOutput(decodeHTML(text));
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
    const sample = '<div class="example">Hello & World!</div>';
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
        title="HTML Entity Encoder/Decoder"
        description="Convert text to and from HTML entity encoding"
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
                <SelectTrigger className="w-[120px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encode">Encode</SelectItem>
                  <SelectItem value="decode">Decode</SelectItem>
                </SelectContent>
              </Select>
            </ToolToolbar>
          }
          heightClass="h-[calc(100vh-17rem)]"
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
            extensions={[html()]}
            placeholder={
              mode === 'encode' ? 'Enter text to encode' : 'Enter HTML entities to decode'
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
            extensions={[html()]}
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
