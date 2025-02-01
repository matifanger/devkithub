import React, { useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { php } from '@codemirror/lang-php';
import { EditorView } from '@codemirror/view';

export function PhpDeserializerPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const deserializePhp = useCallback((phpStr: string) => {
    try {
      if (!phpStr.trim()) {
        setOutput('');
        setError('');
        return;
      }

      // Handle PHP array format
      if (phpStr.startsWith('(object) array(')) {
        const content = phpStr.slice(15, -1).trim();
        const result: Record<string, unknown> = {};
        
        let currentKey = '';
        let currentValue = '';
        let inString = false;
        let inArray = false;
        let arrayDepth = 0;
        
        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          
          if (char === "'" && content[i - 1] !== '\\') {
            inString = !inString;
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
          }
          
          if (inString || inArray) {
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
                  const pairs = arrayContent.split(',').map(p => p.trim());
                  pairs.forEach(pair => {
                    const [k, v] = pair.split('=>').map(s => s.trim());
                    const key = k.slice(1, -1);
                    obj[key] = v.startsWith("'") ? v.slice(1, -1) : Number(v);
                  });
                  result[currentKey] = obj;
                } else {
                  // Numeric array
                  result[currentKey] = arrayContent.split(',')
                    .map(v => v.trim())
                    .map(v => v.startsWith("'") ? v.slice(1, -1) : Number(v));
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
              const pairs = arrayContent.split(',').map(p => p.trim());
              pairs.forEach(pair => {
                const [k, v] = pair.split('=>').map(s => s.trim());
                const key = k.slice(1, -1);
                obj[key] = v.startsWith("'") ? v.slice(1, -1) : Number(v);
              });
              result[currentKey] = obj;
            } else {
              // Numeric array
              result[currentKey] = arrayContent.split(',')
                .map(v => v.trim())
                .map(v => v.startsWith("'") ? v.slice(1, -1) : Number(v));
            }
          } else if (currentValue === 'null') {
            result[currentKey] = null;
          } else if (currentValue === 'true' || currentValue === 'false') {
            result[currentKey] = currentValue === 'true';
          } else {
            result[currentKey] = Number(currentValue);
          }
        }

        // Convert to PHP array format
        const phpFormat = `(object) array(${
          Object.entries(result as Record<string, unknown>)
            .map(([key, val]) => `'${key}' => ${
              typeof val === 'string' ? `'${val}'` : 
              Array.isArray(val) ? `array(${val.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})` :
              val === null ? 'null' :
              typeof val === 'object' ? `array(${Object.entries(val as Record<string, unknown>).map(([k, v]) => `'${k}' => ${typeof v === 'string' ? `'${v}'` : v}`).join(', ')})` :
              val
            }`)
            .join(',\n  ')
        });`;
        setOutput(phpFormat);
        setError('');
      }

      // Original PHP serialized format handling
      let pos = 0;

      const readUntil = (char: string): string => {
        const start = pos;
        while (pos < phpStr.length && phpStr[pos] !== char) pos++;
        return phpStr.slice(start, pos);
      };

      const readLength = (): number => {
        const length = parseInt(readUntil(':'), 10);
        pos++; // Skip the colon
        return length;
      };

      const deserialize = (): unknown => {
        const type = phpStr[pos++];
        
        switch (type) {
          case 'N': // null
            pos++; // Skip semicolon
            return null;
          
          case 'b': // boolean
            pos++; // Skip colon
            const bool = phpStr[pos++] === '1';
            pos++; // Skip semicolon
            return bool;
          
          case 'i': // integer
            pos++; // Skip colon
            const int = parseInt(readUntil(';'), 10);
            pos++; // Skip semicolon
            return int;
          
          case 'd': // float/double
            pos++; // Skip colon
            const float = parseFloat(readUntil(';'));
            pos++; // Skip semicolon
            return float;
          
          case 's': // string
            pos++; // Skip colon
            const strLen = readLength();
            pos++; // Skip quote
            const str = phpStr.slice(pos, pos + strLen);
            pos += strLen + 2; // Skip string content, quotes and semicolon
            return str;
          
          case 'a': // array/object
            pos++; // Skip colon
            const count = readLength();
            pos++; // Skip opening brace
            
            // Check if it's a sequential array
            let isArray = true;
            let tempPos = pos;
            for (let i = 0; i < count; i++) {
              if (phpStr[tempPos] !== 'i') {
                isArray = false;
                break;
              }
              // Skip to next key
              while (tempPos < phpStr.length && phpStr[tempPos] !== ';') tempPos++;
              tempPos++;
            }
            
            if (isArray) {
              const arr = [];
              for (let i = 0; i < count; i++) {
                pos += 2; // Skip i:
                readUntil(';');
                pos++; // Skip semicolon
                arr.push(deserialize());
              }
              pos++; // Skip closing brace
              return arr;
            } else {
              const obj: Record<string, unknown> = {};
              for (let i = 0; i < count; i++) {
                const key = deserialize();
                if (typeof key !== 'string') throw new Error('Invalid object key type');
                obj[key] = deserialize();
              }
              pos++; // Skip closing brace
              return obj;
            }

          case 'O': // Object (stdClass)
            pos++; // Skip colon
            const classNameLength = readLength();
            pos++; // Skip quote
            const className = phpStr.slice(pos, pos + classNameLength);
            pos += classNameLength + 2; // Skip class name, quotes and colon
            const propCount = readLength();
            pos++; // Skip opening brace
            const props: Record<string, unknown> = {};
            for (let i = 0; i < propCount; i++) {
              const key = deserialize();
              if (typeof key !== 'string') throw new Error('Invalid object key type');
              props[key] = deserialize();
            }
            pos++; // Skip closing brace
            return props;
          
          default:
            throw new Error(`Unsupported type: ${type}`);
        }
      };

      const result = deserialize();
      // Convert to PHP array format
      const phpFormat = `(object) array(${
        Object.entries(result as Record<string, unknown>)
          .map(([key, val]) => `'${key}' => ${
            typeof val === 'string' ? `'${val}'` : 
            Array.isArray(val) ? `array(${val.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})` :
            val === null ? 'null' :
            typeof val === 'object' ? `array(${Object.entries(val as Record<string, unknown>).map(([k, v]) => `'${k}' => ${typeof v === 'string' ? `'${v}'` : v}`).join(', ')})` :
            val
          }`)
          .join(',\n  ')
      });`;
      setOutput(phpFormat);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid PHP serialized input');
      setOutput('');
    }
  }, []);

  const handleSample = () => {
    const sample = 'O:8:"stdClass":5:{s:5:"store";s:8:"My Store";s:2:"id";i:123;s:6:"active";b:1;s:8:"products";a:3:{i:0;s:9:"Product 1";i:1;s:9:"Product 2";i:2;s:9:"Product 3";}s:8:"settings";a:3:{s:8:"currency";s:3:"USD";s:8:"tax_rate";d:0.21;s:13:"notifications";b:1;}}';
    setInput(sample);
    deserializePhp(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      deserializePhp(text);
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
        <h1 className="text-2xl font-bold">PHP Deserializer</h1>
        <p className="text-muted-foreground">Convert PHP serialized format to PHP array</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>PHP Serialized Input</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <Button variant="outline" onClick={() => {
                setInput('');
                setOutput('');
                setError('');
              }}>
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
                    'word-break': 'break-all'
                  }
                })
              ]}
              onChange={(value) => {
                setInput(value);
                deserializePhp(value);
              }}
              placeholder="Enter PHP serialized data"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>PHP Array Output</Label>
            <Button variant="outline" onClick={() => copyToClipboard(output)}>
              Copy
            </Button>
          </div>
          
          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          ) : (
            <div className="h-[calc(100vh-17rem)]">
              <CodeMirror
                value={output}
                height="100%"
                className="h-[calc(100vh-17rem)]"
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
                      'word-break': 'break-all'
                    }
                  })
                ]}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 