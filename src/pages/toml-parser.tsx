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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isTomlInput = direction === "toml-to-json";

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">TOML Parser</h1>
        <p className="text-muted-foreground">
          Convert between TOML and JSON formats
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
              {isTomlInput ? "Input TOML" : "Input JSON"}
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
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="output">
              {isTomlInput ? "Output JSON" : "Output TOML"}
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
              extensions={[json()]}
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
