import { json } from '@codemirror/lang-json';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import yaml from 'js-yaml';
import React, { useCallback, useEffect } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ToolCopyButton, ToolClearButton } from '../components/tool-actions';
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolEditorGrid,
  ToolErrorBanner,
} from '../components/tool-page-layout';
import { useToolState } from '../hooks/useToolState';

interface JsonToYamlState {
  input: string;
  indentation: string;
}

const initialState: JsonToYamlState = {
  input: '',
  indentation: '2',
};

export function JsonToYamlPage() {
  const [state, setState, clearState] = useToolState('json-to-yaml', initialState);
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');

  const convertToYaml = useCallback(() => {
    try {
      if (!state.input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      const parsed = JSON.parse(state.input);
      const formatted = yaml.dump(parsed, {
        indent: Number(state.indentation),
        lineWidth: -1,
        noRefs: true,
      });
      setOutput(formatted);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setOutput('');
    }
  }, [state.input, state.indentation]);

  useEffect(() => {
    convertToYaml();
  }, [convertToYaml]);

  const handleSample = () => {
    const sample = JSON.stringify(
      {
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
          ],
        },
      },
      null,
      2
    );
    setState(prev => ({ ...prev, input: sample }));
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setState(prev => ({ ...prev, input: text }));
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="JSON to YAML Converter"
        description="Convert JSON format to YAML with formatting options"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="Input JSON"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" size="sm" onClick={handleSample}>
                Sample
              </Button>
              <ToolClearButton onClear={clearState} />
            </>
          }
        >
          <AppCodeMirror
            value={state.input}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            width="100%"
            onChange={(value) => setState(prev => ({ ...prev, input: value }))}
            extensions={[json()]}
            placeholder="Paste your JSON here"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="YAML Output"
          actions={
            <>
              <Select
                value={state.indentation}
                onValueChange={(v) => setState(prev => ({ ...prev, indentation: v }))}
              >
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
              extensions={[yamlLang()]}
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
