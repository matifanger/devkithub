import { css } from '@codemirror/lang-css';
import { xml } from '@codemirror/lang-xml';
import { EditorView } from '@uiw/react-codemirror';
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

export function SvgToCssPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const convertToCss = useCallback((value: string) => {
    try {
      if (!value.trim()) {
        setOutput('');
        setError('');
        return;
      }

      // Convert SVG to CSS
      const cssOutput = `background-image: url("data:image/svg+xml,${encodeURIComponent(value.trim())}");`;
      setOutput(cssOutput);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid SVG');
      setOutput('');
    }
  }, []);

  const handleSample = () => {
    const sample = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    setInput(sample);
    convertToCss(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      convertToCss(text);
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
        title="SVG to CSS Converter"
        description="Convert SVG code to CSS background-image with data URI"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="Input SVG"
          actions={
            <>
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
            height="100%"
            width="100%"
            onChange={(value) => {
              setInput(value);
              convertToCss(value);
            }}
            extensions={[xml(), EditorView.lineWrapping]}
            placeholder="Paste your SVG code here"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="CSS Output"
          actions={<ToolCopyButton value={output} />}
        >
          <>
            <ToolErrorBanner error={error} />
            {!error && (
              <AppCodeMirror
                value={output}
                className="h-[calc(100vh-17rem)]"
                height="100%"
                width="100%"
                extensions={[css(), EditorView.lineWrapping]}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                }}
              />
            )}
          </>
        </ToolEditorPanel>
      </ToolEditorGrid>
    </ToolPageContainer>
  );
}
