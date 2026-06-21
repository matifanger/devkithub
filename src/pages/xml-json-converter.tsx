/**
 * XML ↔ JSON Converter
 *
 * Converts between XML and JSON formats with support for attributes and arrays.
 *
 * Features:
 * - XML to JSON conversion
 * - JSON to XML conversion
 * - Support for XML attributes
 * - Handle arrays in XML
 * - Pretty print output
 *
 * How to use:
 * 1. Select conversion direction (XML to JSON or JSON to XML)
 * 2. Paste your input in the left panel
 * 3. View converted output in the right panel
 * 4. Use Format to prettify the output
 */

import { json } from "@codemirror/lang-json";
import { xml as xmlLang } from "@codemirror/lang-xml";
import parser from "xml2js";
import React, { useCallback, useEffect, useState } from "react";
import { AppCodeMirror } from "../components/app-code-mirror";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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

export function XmlJsonConverterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [direction, setDirection] = useState("xml-to-json");
  const [spaces, setSpaces] = useState("2");
  const [rootElement, setRootElement] = useState("root");
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const parserConfig = {
      explicitArray: false,
      mergeAttrs: true,
      ignoreAttrs: false,
      charkey: "value",
    };

    try {
      if (direction === "xml-to-json") {
        const xmlParser = new parser.Parser(parserConfig);
        xmlParser.parseString(input, (err: Error | null, result: unknown) => {
          if (err) {
            setError(err.message);
            setOutput("");
            return;
          }
          const formatted = JSON.stringify(result, null, Number(spaces));
          setOutput(formatted);
        });
      } else {
        const jsonObj = JSON.parse(input);
        const xmlBuilder = new parser.Builder({
          xmldec: { version: "1.0", encoding: "UTF-8" },
          rootName: rootElement || "root",
          renderOpts: { pretty: true, indent: "  " },
          cdata: true,
        });

        let xmlResult = xmlBuilder.buildObject(jsonObj);

        if (rootElement && rootElement !== "root") {
          const rootPattern = new RegExp(`<root>`, "g");
          xmlResult = xmlResult.replace(rootPattern, `<${rootElement}>`);
          const closeRootPattern = new RegExp(`</root>`, "g");
          xmlResult = xmlResult.replace(closeRootPattern, `</${rootElement}>`);
        }

        setOutput(xmlResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
      setOutput("");
    }
  }, [input, direction, spaces, rootElement]);

  useEffect(() => {
    convert();
  }, [convert]);

  const handleFormat = () => {
    try {
      if (direction === "xml-to-json") {
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
    if (direction === "xml-to-json") {
      setInput(`<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book id="1">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
  </book>
  <book id="2">
    <title>1984</title>
    <author>George Orwell</author>
  </book>
</library>`);
    } else {
      setInput(`{
  "library": {
    "book": [
      {
        "id": "1",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald"
      },
      {
        "id": "2",
        "title": "1984",
        "author": "George Orwell"
      }
    ]
  }
}`);
    }
  };

  const isXmlInput = direction === "xml-to-json";

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="XML ↔ JSON Converter"
        description="Convert between XML and JSON formats"
      />

      <ToolToolbar>
        <div className="flex items-center gap-2">
          <Label>Direction:</Label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xml-to-json">XML → JSON</SelectItem>
              <SelectItem value="json-to-xml">JSON → XML</SelectItem>
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

        {direction === "json-to-xml" && (
          <div className="flex items-center gap-2">
            <Label>Root element:</Label>
            <Input
              className="w-32"
              value={rootElement}
              onChange={(e) => setRootElement(e.target.value)}
              placeholder="root"
            />
          </div>
        )}

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
        <ToolEditorPanel
          label={isXmlInput ? "Input XML" : "Input JSON"}
          actions={
            <ToolToolbar>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setInput(text);
                  } catch { /* noop */ }
                }}
              >
                Clipboard
              </Button>
              <ToolClearButton onClear={() => setInput("")} />
            </ToolToolbar>
          }
        >
          <AppCodeMirror
            value={input}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            onChange={setInput}
            placeholder={
              isXmlInput
                ? "Paste your XML here..."
                : "Paste your JSON here..."
            }
            extensions={[isXmlInput ? xmlLang() : json()]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label={isXmlInput ? "Output JSON" : "Output XML"}
          actions={<ToolCopyButton value={output} />}
        >
          {error ? (
            <ToolErrorBanner error={error} />
          ) : (
            <AppCodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              extensions={[isXmlInput ? json() : xmlLang()]}
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
