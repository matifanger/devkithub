import { json } from '@codemirror/lang-json';
import { php } from '@codemirror/lang-php';
import { EditorView } from '@codemirror/view';
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

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="JSON to PHP"
        description="Convert JSON to PHP array format"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="JSON Input"
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
        </ToolEditorPanel>

        <ToolEditorPanel
          label="PHP Array Output"
          actions={<ToolCopyButton value={output} />}
        >
          {error ? (
            <ToolErrorBanner error={error} />
          ) : (
            <AppCodeMirror
              value={output}
              height="100%"
              className="h-[calc(100vh-17rem)]"
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
          )}
        </ToolEditorPanel>
      </ToolEditorGrid>
    </ToolPageContainer>
  );
}
