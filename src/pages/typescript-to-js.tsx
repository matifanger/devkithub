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
import { Label } from "../components/ui/label";

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">TypeScript to JavaScript</h1>
        <p className="text-muted-foreground">
          Convert TypeScript code to JavaScript
        </p>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={handleSample}>
          Sample
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setInput("");
            setOutput("");
          }}
        >
          Clear
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="input">Input TypeScript</Label>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              onChange={setInput}
              placeholder="Paste your TypeScript here..."
              extensions={[javascript({ typescript: true })]}
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
            <Label htmlFor="output">Output JavaScript</Label>
            {output && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(output)}
              >
                Copy
              </Button>
            )}
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              extensions={[javascript()]}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
