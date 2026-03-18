/**
 * Excel ↔ JSON/CSV Converter
 *
 * Convert between Excel files (XLSX, XLS) and JSON/CSV formats.
 *
 * Features:
 * - Excel to JSON conversion
 * - Excel to CSV conversion
 * - JSON to Excel conversion
 * - CSV to Excel conversion
 * - Multiple sheet support
 *
 * How to use:
 * 1. Select conversion direction
 * 2. Upload or paste your Excel/JSON/CSV data
 * 3. View converted output or download Excel file
 */

import { json } from "@codemirror/lang-json";
import * as XLSX from "xlsx";
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

export function ExcelConverterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [direction, setDirection] = useState("excel-to-json");
  const [sheetName, setSheetName] = useState("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (direction === "excel-to-json" || direction === "excel-to-csv") {
        const binaryString = atob(input);
        const workbook = XLSX.read(binaryString, { type: "binary" });

        const sheetNames = workbook.SheetNames;
        setSheets(sheetNames);

        const selectedSheet = sheetName || sheets[0];
        const worksheet = workbook.Sheets[selectedSheet];

        if (direction === "excel-to-json") {
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const formatted = JSON.stringify(jsonData, null, 2);
          setOutput(formatted);
        } else {
          const csvData = XLSX.utils.sheet_to_csv(worksheet);
          setOutput(csvData);
        }
      } else if (
        direction === "json-to-excel" ||
        direction === "csv-to-excel"
      ) {
        let data: object[];

        if (direction === "json-to-excel") {
          const parsed = JSON.parse(input);
          data = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          const lines = input.split("\n");
          const headers = lines[0].split(",").map((h) => h.trim());
          data = lines.slice(1).map((line) => {
            const values = line.split(",");
            const row: Record<string, string> = {};
            headers.forEach((header, i) => {
              row[header] = values[i]?.trim() || "";
            });
            return row;
          });
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "base64",
        });
        setOutput(excelBuffer);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
      setOutput("");
    }
  }, [input, direction, sheetName, sheets]);

  useEffect(() => {
    convert();
  }, [convert]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(",")[1];
      setInput(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!output) return;

    const binaryString = atob(output);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isExcelInput = direction.startsWith("excel-to");
  const isExcelOutput = direction.endsWith("excel");

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Excel ↔ JSON/CSV Converter</h1>
        <p className="text-muted-foreground">
          Convert between Excel files and JSON/CSV formats
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Label>Direction:</Label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel-to-json">Excel → JSON</SelectItem>
              <SelectItem value="excel-to-csv">Excel → CSV</SelectItem>
              <SelectItem value="json-to-excel">JSON → Excel</SelectItem>
              <SelectItem value="csv-to-excel">CSV → Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sheets.length > 1 && (
          <div className="flex items-center gap-2">
            <Label>Sheet:</Label>
            <Select value={sheetName || sheets[0]} onValueChange={setSheetName}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sheets.map((sheet) => (
                  <SelectItem key={sheet} value={sheet}>
                    {sheet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isExcelInput && (
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="w-64"
            />
          </div>
        )}

        <Button
          variant="outline"
          onClick={() => {
            setInput("");
            setOutput("");
            setSheets([]);
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
              {isExcelInput ? "Input (Base64 Excel)" : "Input"}
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
                isExcelInput
                  ? "Upload Excel file or paste Base64..."
                  : direction === "json-to-excel"
                    ? "Paste JSON here..."
                    : "Paste CSV here..."
              }
              extensions={[isExcelInput ? [] : json()]}
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
              {isExcelOutput ? "Output (Excel Base64)" : "Output"}
            </Label>
            {output && !isExcelOutput && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(output)}
              >
                Copy
              </Button>
            )}
            {output && isExcelOutput && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                Download
              </Button>
            )}
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={isExcelOutput ? "[Excel file generated]" : output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              extensions={[isExcelOutput ? [] : json()]}
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
