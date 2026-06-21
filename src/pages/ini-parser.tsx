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
import { ToolCopyButton, ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolEditorGrid,
  ToolToolbar,
  ToolErrorBanner,
} from "../components/tool-page-layout";

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

  const isIniInput = direction === "ini-to-json";

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="INI Parser"
        description="Convert between INI and JSON formats"
      />

      <ToolToolbar>
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
        <ToolClearButton
          onClear={() => {
            setInput("");
            setOutput("");
          }}
        />
      </ToolToolbar>

      <ToolEditorGrid>
        <ToolEditorPanel label={isIniInput ? "Input INI" : "Input JSON"}>
          <AppCodeMirror
            value={input}
            className="h-[calc(100vh-17rem)]"
            height="100%"
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
        </ToolEditorPanel>

        <ToolEditorPanel
          label={isIniInput ? "Output JSON" : "Output INI"}
          actions={<ToolCopyButton value={output} />}
        >
          {error ? (
            <ToolErrorBanner error={error} />
          ) : (
            <AppCodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              extensions={[isIniInput ? json() : []]}
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
