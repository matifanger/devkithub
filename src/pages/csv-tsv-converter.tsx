/**
 * CSV ↔ TSV Converter
 *
 * Convert between CSV (Comma Separated Values) and TSV (Tab Separated Values) formats.
 *
 * Features:
 * - CSV to TSV conversion
 * - TSV to CSV conversion
 * - Header row toggle
 *
 * How to use:
 * 1. Select conversion direction (CSV to TSV or TSV to CSV)
 * 2. Paste your data in the left panel
 * 3. View converted output
 */

import React, { useCallback, useEffect, useState } from "react";
import { AppCodeMirror } from "../components/app-code-mirror";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Papa from "papaparse";

export function CsvTsvConverterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [direction, setDirection] = useState("csv-to-tsv");
  const [hasHeader, setHasHeader] = useState(true);
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const delimiter = direction === "csv-to-tsv" ? "," : "\t";
      const outputDelimiter = direction === "csv-to-tsv" ? "\t" : ",";

      const parsed = Papa.parse(input, {
        delimiter,
        header: hasHeader,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        setError(parsed.errors[0].message);
        setOutput("");
        return;
      }

      const result = Papa.unparse(parsed.data, {
        delimiter: outputDelimiter,
        header: hasHeader,
      });

      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
      setOutput("");
    }
  }, [input, direction, hasHeader]);

  useEffect(() => {
    convert();
  }, [convert]);

  const handleSample = () => {
    if (direction === "csv-to-tsv") {
      setInput(`name,age,city,email
John Doe,30,New York,john@example.com
Jane Smith,25,Los Angeles,jane@example.com`);
    } else {
      setInput(`name	age	city	email
John Doe	30	New York	john@example.com
Jane Smith	25	Los Angeles	jane@example.com`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isCsvInput = direction === "csv-to-tsv";

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">CSV ↔ TSV Converter</h1>
        <p className="text-muted-foreground">
          Convert between CSV and TSV formats
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
              <SelectItem value="csv-to-tsv">CSV → TSV</SelectItem>
              <SelectItem value="tsv-to-csv">TSV → CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-header"
            checked={hasHeader}
            onCheckedChange={(checked) => setHasHeader(!!checked)}
          />
          <Label htmlFor="has-header">First row is header</Label>
        </div>

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
              {isCsvInput ? "Input CSV" : "Input TSV"}
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
                isCsvInput ? "Paste your CSV here..." : "Paste your TSV here..."
              }
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
              {isCsvInput ? "Output TSV" : "Output CSV"}
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
