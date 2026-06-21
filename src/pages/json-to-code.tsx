import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { php } from '@codemirror/lang-php';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@uiw/react-codemirror';
import React, { useCallback, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { ToolCopyButton, ToolClearButton } from '../components/tool-actions';
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolEditorGrid,
  ToolToolbar,
  ToolErrorBanner,
} from '../components/tool-page-layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function JsonToCodePage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('typescript');
  const [modelName, setModelName] = useState('MyModel');

  const convertJsonToCode = useCallback(
    (jsonStr: string, language: string, modelName: string): string => {
      try {
        if (!jsonStr.trim()) {
          return '';
        }

        const data = JSON.parse(jsonStr);

        switch (language) {
          case 'typescript':
            return generateTypeScript(data, modelName);
          case 'python':
            return generatePython(data, modelName);
          case 'php':
            return generatePHP(data, modelName);
          case 'java':
            return generateJava(data, modelName);
          default:
            throw new Error('Unsupported language');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON input');
        return '';
      }
    },
    []
  );

  const inferType = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
      const itemType = value.length > 0 ? inferType(value[0]) : 'any';
      return `${itemType}[]`;
    }
    if (typeof value === 'object') return 'object';
    return typeof value;
  };

  const generateTypeScript = (data: unknown, modelName: string): string => {
    const properties = Object.entries(data as Record<string, unknown>);
    const types = properties.map(([key, value]) => {
      const type = inferType(value);
      if (type === 'object') {
        const nestedModelName = `${modelName}${key.charAt(0).toUpperCase() + key.slice(1)}`;
        const nestedInterface = generateTypeScript(value, nestedModelName);
        return `${nestedInterface}\n\n  ${key}: ${nestedModelName};`;
      }
      return `  ${key}: ${type};`;
    });

    return `interface ${modelName} {
${types.join('\n')}
}

// Example usage:
const data: ${modelName} = ${JSON.stringify(data, null, 2)};`;
  };

  const generatePython = (data: unknown, modelName: string): string => {
    const properties = Object.entries(data as Record<string, unknown>);
    const types = properties.map(([key, value]) => {
      const type = inferType(value);
      if (type === 'object') {
        const nestedModelName = `${modelName}${key.charAt(0).toUpperCase() + key.slice(1)}`;
        const nestedClass = generatePython(value, nestedModelName);
        return `${nestedClass}\n\n    ${key}: ${nestedModelName}`;
      }
      const pythonType =
        type === 'string'
          ? 'str'
          : type === 'number'
            ? 'float'
            : type === 'boolean'
              ? 'bool'
              : type.includes('[]')
                ? 'List[Any]'
                : 'Any';
      return `    ${key}: ${pythonType}`;
    });

    return `from dataclasses import dataclass
from typing import List, Any

@dataclass
class ${modelName}:
${types.join('\n')}

# Example usage:
data = ${modelName}(**${JSON.stringify(data, null, 2)})`;
  };

  const generatePHP = (data: unknown, modelName: string): string => {
    const properties = Object.entries(data as Record<string, unknown>);
    const types = properties.map(([key, value]) => {
      const type = inferType(value);
      if (type === 'object') {
        const nestedModelName = `${modelName}${key.charAt(0).toUpperCase() + key.slice(1)}`;
        const nestedClass = generatePHP(value, nestedModelName);
        return `${nestedClass}\n\n    private ${nestedModelName} $${key};`;
      }
      const phpType =
        type === 'string'
          ? 'string'
          : type === 'number'
            ? 'float'
            : type === 'boolean'
              ? 'bool'
              : type.includes('[]')
                ? 'array'
                : 'mixed';
      return `    private ${phpType} $${key};`;
    });

    const gettersSetters = properties.map(([key]) => {
      const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
      return `
    public function get${capitalizedKey}()
    {
        return $this->${key};
    }

    public function set${capitalizedKey}($value)
    {
        $this->${key} = $value;
        return $this;
    }`;
    });

    return `<?php

class ${modelName}
{
${types.join('\n')}
${gettersSetters.join('\n')}
}

// Example usage:
$data = json_decode('${JSON.stringify(data)}', true);
$object = new ${modelName}();
foreach ($data as $key => $value) {
    $setter = 'set' . ucfirst($key);
    $object->$setter($value);
}`;
  };

  const generateJava = (data: unknown, modelName: string): string => {
    const properties = Object.entries(data as Record<string, unknown>);
    const types = properties.map(([key, value]) => {
      const type = inferType(value);
      if (type === 'object') {
        const nestedModelName = `${modelName}${key.charAt(0).toUpperCase() + key.slice(1)}`;
        const nestedClass = generateJava(value, nestedModelName);
        return `${nestedClass}\n\n    private ${nestedModelName} ${key};`;
      }
      const javaType =
        type === 'string'
          ? 'String'
          : type === 'number'
            ? 'Double'
            : type === 'boolean'
              ? 'Boolean'
              : type.includes('[]')
                ? 'List<Object>'
                : 'Object';
      return `    private ${javaType} ${key};`;
    });

    const gettersSetters = properties.map(([key]) => {
      const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
      const type = inferType((data as Record<string, unknown>)[key]);
      const javaType =
        type === 'string'
          ? 'String'
          : type === 'number'
            ? 'Double'
            : type === 'boolean'
              ? 'Boolean'
              : type.includes('[]')
                ? 'List<Object>'
                : 'Object';
      return `
    public ${javaType} get${capitalizedKey}() {
        return ${key};
    }

    public void set${capitalizedKey}(${javaType} ${key}) {
        this.${key} = ${key};
    }`;
    });

    return `import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ${modelName} {
${types.join('\n')}
${gettersSetters.join('\n')}

    // Example usage with Jackson:
    public static void main(String[] args) {
        ObjectMapper mapper = new ObjectMapper();
        String json = "${JSON.stringify(data).replace(/"/g, '\\"')}";
        ${modelName} data = mapper.readValue(json, ${modelName}.class);
    }
}`;
  };

  const handleSample = () => {
    const sample = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      isActive: true,
      roles: ['user', 'admin'],
      address: {
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '10001',
      },
    };
    setInput(JSON.stringify(sample, null, 2));
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const getLanguageExtension = (language: string) => {
    switch (language) {
      case 'typescript':
        return javascript();
      case 'python':
        return python();
      case 'php':
        return php();
      case 'java':
        return javascript();
      default:
        return javascript();
    }
  };

  const generatedCode = convertJsonToCode(input, activeTab, modelName);

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="JSON to Code"
        description="Convert JSON to type definitions and classes"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="JSON Input"
          actions={
            <ToolToolbar>
              <div className="flex items-center gap-2">
                <Label>Model Name:</Label>
                <Input
                  type="text"
                  spellCheck={false}
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Enter model name"
                />
              </div>
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <ToolClearButton onClear={() => setInput('')} />
            </ToolToolbar>
          }
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
              <AppCodeMirror
                value={input}
                className="h-full"
                height="100%"
                width="100%"
                extensions={[json(), EditorView.lineWrapping]}
                onChange={(value) => {
                  setInput(value);
                  setError('');
                }}
                placeholder="Enter your JSON here"
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                }}
              />
            </div>
            <ToolErrorBanner error={error} />
          </div>
        </ToolEditorPanel>

        <ToolEditorPanel
          label="Generated Code"
          actions={
            <>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                </SelectContent>
              </Select>
              <ToolCopyButton value={generatedCode} />
            </>
          }
        >
          <AppCodeMirror
            value={generatedCode}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            width="100%"
            extensions={[getLanguageExtension(activeTab)]}
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
