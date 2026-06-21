/**
 * TOML Parser
 *
 * Parse and convert TOML (Tom's Obvious, Minimal Language) to JSON and vice versa.
 *
 * Features:
 * - TOML to JSON conversion
 * - JSON to TOML conversion
 * - Support for all TOML data types
 *
 * How to use:
 * 1. Select conversion direction (TOML to JSON or JSON to TOML)
 * 2. Paste your input in the left panel
 * 3. View converted output in the right panel
 */

import { json } from "@codemirror/lang-json";
import * as toml from "@iarna/toml";
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

export function TomlParserPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [direction, setDirection] = useState("toml-to-json");
  const [spaces, setSpaces] = useState("2");
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (direction === "toml-to-json") {
        const parsed = toml.parse(input);
        const formatted = JSON.stringify(parsed, null, Number(spaces));
        setOutput(formatted);
      } else {
        const jsonObj = JSON.parse(input);
        const tomlStr = toml.stringify(jsonObj);
        setOutput(tomlStr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
      setOutput("");
    }
  }, [input, direction, spaces]);

  useEffect(() => {
    convert();
  }, [convert]);

  const handleFormat = () => {
    try {
      if (direction === "toml-to-json") {
        const formatted = JSON.stringify(
          JSON.parse(output),
          null,
          Number(spaces),
        );
        setOutput(formatted);
      }
    } catch {
      // Ignore formatting errors
    }
  };

  const handleSample = () => {
    if (direction === "toml-to-json") {
      setInput(`# This is a TOML document

title = "TOML Example"

[owner]
name = "Tom Preston-Werner"
organization = "GitHub"

[database]
server = "192.168.1.1"
ports = [8001, 8002, 8003]
enabled = true`);
    } else {
      setInput(`{
  "title": "TOML Example",
  "owner": {
    "name": "Tom Preston-Werner",
    "organization": "GitHub"
  },
  "database": {
    "server": "192.168.1.1",
    "ports": [8001, 8002, 8003],
    "enabled": true
  }
}`);
    }
  };

  const isTomlInput = direction === "toml-to-json";

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="TOML Parser"
        description="Convert between TOML and JSON formats"
      />

      <ToolToolbar>
        <div className="flex items-center gap-2">
          <Label>Direction:</Label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toml-to-json">TOML → JSON</SelectItem>
              <SelectItem value="json-to-toml">JSON → TOML</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label>Spaces:</Label>
          <Select value={spaces} onValueChange={setSpaces}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleFormat}>
          Format
        </Button>
        <Button variant="outline" onClick={handleSample}>
          Sample
        </Button>
        <ToolClearButton onClear={() => { setInput(""); setOutput(""); }} />
      </ToolToolbar>

      <ToolEditorGrid>
        <ToolEditorPanel
          label={isTomlInput ? "Input TOML" : "Input JSON"}
        >
          <AppCodeMirror
            value={input}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            onChange={setInput}
            placeholder={
              isTomlInput
                ? "Paste your TOML here..."
                : "Paste your JSON here..."
            }
            extensions={[isTomlInput ? [] : json()]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label={isTomlInput ? "Output JSON" : "Output TOML"}
          actions={<ToolCopyButton value={output} />}
        >
          {error ? (
            <ToolErrorBanner error={error} />
          ) : (
            <AppCodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              extensions={[json()]}
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
