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
                  const pairs = arrayContent.split(',').map((p) => p.trim());
                  pairs.forEach((pair) => {
                    const [k, v] = pair.split('=>').map((s) => s.trim());
                    const key = k.slice(1, -1);
                    obj[key] = v.startsWith("'") ? v.slice(1, -1) : Number(v);
                  });
                  result[currentKey] = obj;
                } else {
                  // Numeric array
                  result[currentKey] = arrayContent
                    .split(',')
                    .map((v) => v.trim())
                    .map((v) => (v.startsWith("'") ? v.slice(1, -1) : Number(v)));
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
              const pairs = arrayContent.split(',').map((p) => p.trim());
              pairs.forEach((pair) => {
                const [k, v] = pair.split('=>').map((s) => s.trim());
                const key = k.slice(1, -1);
                obj[key] = v.startsWith("'") ? v.slice(1, -1) : Number(v);
              });
              result[currentKey] = obj;
            } else {
              // Numeric array
              result[currentKey] = arrayContent
                .split(',')
                .map((v) => v.trim())
                .map((v) => (v.startsWith("'") ? v.slice(1, -1) : Number(v)));
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
        const phpFormat = `(object) array(${Object.entries(result as Record<string, unknown>)
          .map(
            ([key, val]) =>
              `'${key}' => ${
                typeof val === 'string'
                  ? `'${val}'`
                  : Array.isArray(val)
                    ? `array(${val.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(', ')})`
                    : val === null
                      ? 'null'
                      : typeof val === 'object'
                        ? `array(${Object.entries(val as Record<string, unknown>)
                            .map(([k, v]) => `'${k}' => ${typeof v === 'string' ? `'${v}'` : v}`)
                            .join(', ')})`
                        : val
              }`
          )
          .join(',\n  ')});`;
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
        let value: unknown;
        const type = phpStr[pos++];

        switch (type) {
          case 'N': {
            // null
            pos++; // Skip semicolon
            value = null;
            break;
          }

          case 'b': {
            // boolean
            pos++; // Skip colon
            const bool = phpStr[pos++] === '1';
            pos++; // Skip semicolon
            value = bool;
            break;
          }

          case 'i': {
            // integer
            pos++; // Skip colon
            const int = parseInt(readUntil(';'), 10);
            pos++; // Skip semicolon
            value = int;
            break;
          }

          case 'd': {
            // float/double
            pos++; // Skip colon
            const float = parseFloat(readUntil(';'));
            pos++; // Skip semicolon
            value = float;
            break;
          }

          case 's': {
            // string
            pos++; // Skip colon
            const strLen = readLength();
            pos++; // Skip quote
            const str = phpStr.slice(pos, pos + strLen);
            pos += strLen + 2; // Skip string content, quotes and semicolon
            value = str;
            break;
          }

          case 'a': {
            // array/object
            pos++; // Skip colon
            const count = readLength();
            pos++; // Skip opening brace

            // Check if it's a sequential array
            let isArray = true;
            let tempPos = pos;
            for (let i = 0; i < count && isArray; i++) {
              const type = phpStr[tempPos];
              if (type === 'i') {
                tempPos++; // Skip i
                tempPos++; // Skip :
                while (tempPos < phpStr.length && phpStr[tempPos] !== ';') tempPos++;
                tempPos++; // Skip ;
                // Skip the value
                while (tempPos < phpStr.length && phpStr[tempPos] !== ';') tempPos++;
                tempPos++; // Skip ;
              } else {
                isArray = false;
              }
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
              value = arr;
            } else {
              const obj: Record<string, unknown> = {};
              for (let i = 0; i < count; i++) {
                const keyType = phpStr[pos++];
                if (keyType !== 's') throw new Error('Object property keys must be strings');
                pos++; // Skip colon
                const keyLength = readLength();
                pos++; // Skip quote
                const key = phpStr.slice(pos, pos + keyLength);
                pos += keyLength + 2; // Skip string content, quotes and semicolon
                obj[key] = deserialize();
              }
              pos++; // Skip closing brace
              value = obj;
            }
            break;
          }

          case 'O': {
            // Object (stdClass)
            pos++; // Skip colon
            const classNameLength = readLength();
            pos++; // Skip quote
            const className = phpStr.slice(pos, pos + classNameLength);
            pos += classNameLength + 2; // Skip class name, quotes and colon
            const propCount = readLength();
            pos++; // Skip opening brace
            const props: Record<string, unknown> = {};
            for (let i = 0; i < propCount; i++) {
              const keyType = phpStr[pos++];
              if (keyType !== 's') throw new Error('Object property keys must be strings');
              pos++; // Skip colon
              const keyLength = readLength();
              pos++; // Skip quote
              const key = phpStr.slice(pos, pos + keyLength);
              pos += keyLength + 2; // Skip string content, quotes and semicolon
              props[key] = deserialize();
            }
            pos++; // Skip closing brace
            value = props;
            break;
          }

          default:
            throw new Error(`Unsupported type: ${type}`);
        }

        return value;
      };

      const result = deserialize();
      // Convert to PHP array format
      const phpFormat = `(object) array(${Object.entries(result as Record<string, unknown>)
        .map(
          ([key, val]) =>
            `'${key}' => ${
              typeof val === 'string'
                ? `'${val}'`
                : Array.isArray(val)
                  ? `array(${val.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(', ')})`
                  : val === null
                    ? 'null'
                    : typeof val === 'object'
                      ? `array(${Object.entries(val as Record<string, unknown>)
                          .map(([k, v]) => `'${k}' => ${typeof v === 'string' ? `'${v}'` : v}`)
                          .join(', ')})`
                      : val
            }`
        )
        .join(',\n  ')});`;
      setOutput(phpFormat);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid PHP serialized input');
      setOutput('');
    }
  }, []);

  const handleSample = () => {
    const sample =
      'O:8:"stdClass":5:{s:5:"store";s:8:"My Store";s:2:"id";i:123;s:6:"active";b:1;s:8:"products";a:3:{i:0;s:9:"Product 1";i:1;s:9:"Product 2";i:2;s:9:"Product 3";}s:8:"settings";a:3:{s:8:"currency";s:3:"USD";s:8:"tax_rate";d:0.21;s:13:"notifications";b:1;}}';
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

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="PHP Deserializer"
        description="Convert PHP serialized format to PHP array"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="PHP Serialized Input"
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
              deserializePhp(value);
            }}
            placeholder="Enter PHP serialized data"
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
