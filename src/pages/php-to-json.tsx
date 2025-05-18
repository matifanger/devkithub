import { json } from '@codemirror/lang-json';
import { php } from '@codemirror/lang-php';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import React, { useCallback, useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export function PhpToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const convertPhpToJson = useCallback((phpStr: string) => {
    try {
      if (!phpStr.trim()) {
        setOutput('');
        setError('');
        return;
      }

      // Parse PHP array format
      if (!phpStr.startsWith('(object) array(') && !phpStr.startsWith('array(')) {
        throw new Error('Input must start with "(object) array(" or "array("');
      }

      const isObject = phpStr.startsWith('(object)');
      const content = isObject ? phpStr.slice(15, -1).trim() : phpStr.slice(6, -1).trim();
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

      setOutput(JSON.stringify(result, null, 2));
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
    convertPhpToJson(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      convertPhpToJson(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">PHP to JSON</h1>
        <p className="text-muted-foreground">Convert PHP array to JSON format</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>PHP Array Input</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInput('');
                  setOutput('');
                  setError('');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <CodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              theme={oneDark}
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
                convertPhpToJson(value);
              }}
              placeholder="Enter PHP array"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>JSON Output</Label>
            <Button variant="outline" onClick={() => copyToClipboard(output)}>
              Copy
            </Button>
          </div>

          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
          ) : (
            <div className="h-[calc(100vh-17rem)]">
              <CodeMirror
                value={output}
                height="100%"
                className="h-[calc(100vh-17rem)]"
                theme={oneDark}
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
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
