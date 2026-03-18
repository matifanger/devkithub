/**
 * INI Parser
 *
 * Parse and convert INI configuration files to JSON and vice versa.
 *
 * Features:
 * - INI to JSON conversion
 * - JSON to INI conversion
 * - Support for sections
 * - Support for comments (# and ;)
 *
 * How to use:
 * 1. Select conversion direction (INI to JSON or JSON to INI)
 * 2. Paste your input in the left panel
 * 3. View converted output in the right panel
 */

import { json } from "@codemirror/lang-json";
import ini from "ini";
import React, { useCallback, useEffect, useState } from "react";
import { AppCodeMirror } from "../components/app-code-mirror";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export function IniParserPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [direction, setDirection] = useState("ini-to-json");
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (direction === "ini-to-json") {
        const parsed = ini.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        setOutput(formatted);
      } else {
        const jsonObj = JSON.parse(input);
        const iniStr = ini.stringify(jsonObj);
        setOutput(iniStr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
      setOutput("");
    }
  }, [input, direction]);

  useEffect(() => {
    convert();
  }, [convert]);

  const handleFormat = () => {
    try {
      if (direction === "ini-to-json") {
        const formatted = JSON.stringify(JSON.parse(output), null, 2);
        setOutput(formatted);
      }
    } catch {
      // Ignore formatting errors
    }
  };

  const handleSample = () => {
    if (direction === "ini-to-json") {
      setInput(`; This is a comment
[database]
server = localhost
port = 3306
name = myapp_db

[app]
name = My Application
debug = true`);
    } else {
      setInput(`{
  "database": {
    "server": "localhost",
    "port": "3306",
    "name": "myapp_db"
  },
  "app": {
    "name": "My Application",
    "debug": "true"
  }
}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isIniInput = direction === "ini-to-json";

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">INI Parser</h1>
        <p className="text-muted-foreground">
          Convert between INI and JSON formats
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Label>Direction:</Label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ini-to-json">INI → JSON</SelectItem>
              <SelectItem value="json-to-ini">JSON → INI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleFormat}>
          Format
        </Button>
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
            <Label htmlFor="input">
              {isIniInput ? "Input INI" : "Input JSON"}
            </Label>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              onChange={setInput}
              placeholder={
                isIniInput
                  ? "Paste your INI here..."
                  : "Paste your JSON here..."
              }
              extensions={[isIniInput ? [] : json()]}
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
            <Label htmlFor="output">
              {isIniInput ? "Output JSON" : "Output INI"}
            </Label>
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
              extensions={[isIniInput ? json() : []]}
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
