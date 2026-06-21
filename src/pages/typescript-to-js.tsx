/**
 * TypeScript to JavaScript Converter
 *
 * Converts TypeScript code to JavaScript using the Sucrase transpiler.
 *
 * Features:
 * - TypeScript to ES5/ES6 JavaScript conversion
 * - Remove type annotations
 * - Transform modern JS syntax
 *
 * How to use:
 * 1. Paste your TypeScript code in the left panel
 * 2. View the converted JavaScript in the right panel
 * 3. Use the Copy button to copy the result
 */

import { javascript } from "@codemirror/lang-javascript";
import sucrase from "sucrase";
import React, { useCallback, useEffect, useState } from "react";
import { AppCodeMirror } from "../components/app-code-mirror";
import { Button } from "../components/ui/button";
import { ToolCopyButton, ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolEditorGrid,
  ToolToolbar,
  ToolErrorBanner,
} from "../components/tool-page-layout";

export function TypescriptToJsPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const result = sucrase.transform(input, {
        transforms: ["typescript", "jsx"],
      });
      setOutput(result.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
      setOutput("");
    }
  }, [input]);

  useEffect(() => {
    convert();
  }, [convert]);

  const handleSample = () => {
    setInput(`interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

function greetUser(user: User): string {
  const greeting = \`Hello, \${user.name}!\`;
  return greeting;
}

const users: User[] = [
  { id: 1, name: "John", email: "john@example.com" },
  { id: 2, name: "Jane", email: "jane@example.com", age: 25 }
];`);
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="TypeScript to JavaScript"
        description="Convert TypeScript code to JavaScript"
      />

      <ToolToolbar>
        <Button variant="outline" onClick={handleSample}>
          Sample
        </Button>
        <ToolClearButton onClear={() => { setInput(""); setOutput(""); }} />
      </ToolToolbar>

      <ToolEditorGrid>
        <ToolEditorPanel label="Input TypeScript">
          <AppCodeMirror
            value={input}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            onChange={setInput}
            placeholder="Paste your TypeScript here..."
            extensions={[javascript({ typescript: true })]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="Output JavaScript"
          actions={<ToolCopyButton value={output} />}
        >
          {error ? (
            <ToolErrorBanner error={error} />
          ) : (
            <AppCodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              extensions={[javascript()]}
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
