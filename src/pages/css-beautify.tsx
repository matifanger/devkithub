import { css } from '@codemirror/lang-css';
import { css as beautifyCss } from 'js-beautify';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function CssBeautifyPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [spaces, setSpaces] = useState('2');
  const [mode, setMode] = useState('beautify');

  const formatCss = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      if (mode === 'beautify') {
        const formatted = beautifyCss(input, {
          indent_size: Number(spaces),
          indent_char: ' ',
          max_preserve_newlines: 2,
          preserve_newlines: true,
          end_with_newline: false,
          wrap_line_length: 0,
          indent_empty_lines: false,
        });
        setOutput(formatted);
      } else {
        // Minify: remove all unnecessary whitespace and comments
        const minified = input
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/\s*([:;,{}])\s*/g, '$1') // Remove spaces around :;,{}
          .replace(/;\}/g, '}') // Remove unnecessary semicolons
          .trim();
        setOutput(minified);
      }

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid CSS');
      setOutput('');
    }
  }, [input, spaces, mode]);

  useEffect(() => {
    formatCss();
  }, [formatCss]);

  const handleSample = () => {
    const sample = `
.container { display: flex; flex-direction: column; padding: 20px } .header {background-color: #f5f5f5; border-radius: 4px; padding: 15px; margin-bottom: 20px} /* Button styles */
.button { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer }
} .button:hover { background-color: #0056b3 }
`;
    setInput(sample.trim());
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
        title="CSS Beautify/Minify"
        description="Format or minify your CSS code"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="Input"
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
            extensions={[css()]}
            placeholder="Paste your CSS here"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="Output"
          actions={
            <>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beautify">Beautify</SelectItem>
                  <SelectItem value="minify">Minify</SelectItem>
                </SelectContent>
              </Select>
              {mode === 'beautify' && (
                <Select value={spaces} onValueChange={setSpaces}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Spaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Spaces</SelectItem>
                    <SelectItem value="4">4 Spaces</SelectItem>
                    <SelectItem value="8">8 Spaces</SelectItem>
                  </SelectContent>
                </Select>
              )}
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
              extensions={[css()]}
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
