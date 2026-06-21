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

export function PhpSerializerPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const serializePhp = useCallback((input: string) => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      // Parse PHP array format
      if (!input.startsWith('(object) array(')) {
        throw new Error('Input must start with "(object) array("');
      }

      const content = input.slice(15, -1).trim();
      const result: Record<string, unknown> = {};

      let currentKey = '';
      let currentValue = '';
      let inString = false;
      let inArray = false;
      let arrayDepth = 0;
      let currentStringContent = '';

      for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (char === "'" && content[i - 1] !== '\\') {
          inString = !inString;
          if (inString) {
            currentStringContent = '';
          } else {
            currentValue += `'${currentStringContent}'`;
          }
          continue;
        }

        if (inString) {
          currentStringContent += char;
          continue;
        }

        if (!inString) {
          if (char === '(') {
            inArray = true;
            arrayDepth++;
          } else if (char === ')') {
            arrayDepth--;
            if (arrayDepth === 0) inArray = false;
          }
          // Skip whitespace when not in string or array
          if ((char === ' ' || char === '\n' || char === '\r' || char === '\t') && !inArray)
            continue;
        }

        if (inArray) {
          currentValue += char;
        } else {
          if (char === '=' && content[i + 1] === '>') {
            currentKey = currentValue.slice(1, -1); // Remove quotes
            currentValue = '';
            i++; // Skip >
          } else if (char === ',' && arrayDepth === 0) {
            // Process value
            currentValue = currentValue.trim();
            if (currentValue.startsWith("'") && currentValue.endsWith("'")) {
              result[currentKey] = currentValue.slice(1, -1);
            } else if (currentValue.startsWith('array(')) {
              const arrayContent = currentValue.slice(6, -1);
              if (arrayContent.includes('=>')) {
                // Associative array
                const obj: Record<string, unknown> = {};
                let tempKey = '';
                let tempValue = '';
                let tempInString = false;
                let tempStringContent = '';

                for (let j = 0; j < arrayContent.length; j++) {
                  const tempChar = arrayContent[j];

                  if (tempChar === "'" && arrayContent[j - 1] !== '\\') {
                    tempInString = !tempInString;
                    if (tempInString) {
                      tempStringContent = '';
                    } else {
                      tempValue += `'${tempStringContent}'`;
                    }
                    continue;
                  }

                  if (tempInString) {
                    tempStringContent += tempChar;
                    continue;
                  }

                  if (tempChar === '=' && arrayContent[j + 1] === '>') {
                    tempKey = tempValue.slice(1, -1);
                    tempValue = '';
                    j++; // Skip >
                  } else if (tempChar === ',') {
                    tempValue = tempValue.trim();
                    if (tempValue.startsWith("'") && tempValue.endsWith("'")) {
                      obj[tempKey] = tempValue.slice(1, -1);
                    } else if (tempValue === 'true' || tempValue === 'false') {
                      obj[tempKey] = tempValue === 'true';
                    } else if (tempValue === 'null') {
                      obj[tempKey] = null;
                    } else {
                      obj[tempKey] = Number(tempValue);
                    }
                    tempValue = '';
                  } else {
                    tempValue += tempChar;
                  }
                }

                // Process last value
                if (tempKey && tempValue) {
                  tempValue = tempValue.trim();
                  if (tempValue.startsWith("'") && tempValue.endsWith("'")) {
                    obj[tempKey] = tempValue.slice(1, -1);
                  } else if (tempValue === 'true' || tempValue === 'false') {
                    obj[tempKey] = tempValue === 'true';
                  } else if (tempValue === 'null') {
                    obj[tempKey] = null;
                  } else {
                    obj[tempKey] = Number(tempValue);
                  }
                }

                result[currentKey] = obj;
              } else {
                // Numeric array
                const values = arrayContent
                  .split(',')
                  .map((v) => v.trim())
                  .map((v) => {
                    if (v.startsWith("'") && v.endsWith("'")) {
                      return v.slice(1, -1);
                    } else if (v === 'true' || v === 'false') {
                      return v === 'true';
                    } else if (v === 'null') {
                      return null;
                    } else {
                      return Number(v);
                    }
                  });
                result[currentKey] = values;
              }
            } else if (currentValue === 'null') {
              result[currentKey] = null;
            } else if (currentValue === 'true' || currentValue === 'false') {
              result[currentKey] = currentValue === 'true';
            } else {
              result[currentKey] = Number(currentValue);
            }
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
      }

      // Process last value
      if (currentKey && currentValue) {
        currentValue = currentValue.trim();
        if (currentValue.startsWith("'") && currentValue.endsWith("'")) {
          result[currentKey] = currentValue.slice(1, -1);
        } else if (currentValue.startsWith('array(')) {
          const arrayContent = currentValue.slice(6, -1);
          if (arrayContent.includes('=>')) {
            // Associative array
            const obj: Record<string, unknown> = {};
            let tempKey = '';
            let tempValue = '';
            let tempInString = false;
            let tempStringContent = '';

            for (let j = 0; j < arrayContent.length; j++) {
              const tempChar = arrayContent[j];

              if (tempChar === "'" && arrayContent[j - 1] !== '\\') {
                tempInString = !tempInString;
                if (tempInString) {
                  tempStringContent = '';
                } else {
                  tempValue += `'${tempStringContent}'`;
                }
                continue;
              }

              if (tempInString) {
                tempStringContent += tempChar;
                continue;
              }

              if (tempChar === '=' && arrayContent[j + 1] === '>') {
                tempKey = tempValue.slice(1, -1);
                tempValue = '';
                j++; // Skip >
              } else if (tempChar === ',') {
                tempValue = tempValue.trim();
                if (tempValue.startsWith("'") && tempValue.endsWith("'")) {
                  obj[tempKey] = tempValue.slice(1, -1);
                } else if (tempValue === 'true' || tempValue === 'false') {
                  obj[tempKey] = tempValue === 'true';
                } else if (tempValue === 'null') {
                  obj[tempKey] = null;
                } else {
                  obj[tempKey] = Number(tempValue);
                }
                tempValue = '';
              } else {
                tempValue += tempChar;
              }
            }

            // Process last value
            if (tempKey && tempValue) {
              tempValue = tempValue.trim();
              if (tempValue.startsWith("'") && tempValue.endsWith("'")) {
                obj[tempKey] = tempValue.slice(1, -1);
              } else if (tempValue === 'true' || tempValue === 'false') {
                obj[tempKey] = tempValue === 'true';
              } else if (tempValue === 'null') {
                obj[tempKey] = null;
              } else {
                obj[tempKey] = Number(tempValue);
              }
            }

            result[currentKey] = obj;
          } else {
            // Numeric array
            const values = arrayContent
              .split(',')
              .map((v) => v.trim())
              .map((v) => {
                if (v.startsWith("'") && v.endsWith("'")) {
                  return v.slice(1, -1);
                } else if (v === 'true' || v === 'false') {
                  return v === 'true';
                } else if (v === 'null') {
                  return null;
                } else {
                  return Number(v);
                }
              });
            result[currentKey] = values;
          }
        } else if (currentValue === 'null') {
          result[currentKey] = null;
        } else if (currentValue === 'true' || currentValue === 'false') {
          result[currentKey] = currentValue === 'true';
        } else {
          result[currentKey] = Number(currentValue);
        }
      }

      // Generate PHP serialized format
      const serialize = (value: unknown): string => {
        if (value === null) {
          return 'N;';
        }

        switch (typeof value) {
          case 'string':
            return `s:${value.length}:"${value}";`;
          case 'number':
            if (Number.isInteger(value)) {
              return `i:${value};`;
            }
            return `d:${value};`;
          case 'boolean':
            return `b:${value ? '1' : '0'};`;
          case 'object':
            if (Array.isArray(value)) {
              const elements = value.map((item, index) => `i:${index};${serialize(item)}`).join('');
              return `a:${value.length}:{${elements}}`;
            } else {
              const entries = Object.entries(value);
              const elements = entries
                .map(([key, val]) => `${serialize(key)}${serialize(val)}`)
                .join('');
              return `a:${entries.length}:{${elements}}`;
            }
          default:
            throw new Error(`Unsupported type: ${typeof value}`);
        }
      };

      const output = `O:8:"stdClass":${Object.keys(result).length}:{${Object.entries(result)
        .map(([key, val]) => `${serialize(key)}${serialize(val)}`)
        .join('')}}`;

      setOutput(output);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid PHP array input');
      setOutput('');
    }
  }, []);

  const handleSample = () => {
    const sample = `(object) array(
  'store' => 'My Store',
  'id' => 123,
  'active' => true,
  'products' => array('Product 1', 'Product 2', 'Product 3'),
  'settings' => array('currency' => 'USD', 'tax_rate' => 0.21, 'notifications' => true)
);`;
    setInput(sample);
    serializePhp(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      serializePhp(text);
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
        title="PHP Serializer"
        description="Convert PHP array to serialized format"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="PHP Array Input"
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
            onChange={(value) => {
              setInput(value);
              serializePhp(value);
            }}
            placeholder="Enter PHP array"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="PHP Serialized Output"
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
