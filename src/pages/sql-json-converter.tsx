/**
 * SQL ↔ JSON Converter
 *
 * Convert SQL queries to JSON format and vice versa for easy manipulation and analysis.
 *
 * Features:
 * - SQL to JSON conversion (CREATE TABLE)
 * - JSON to SQL conversion
 * - Format SQL queries
 *
 * How to use:
 * 1. Select conversion direction
 * 2. Enter your SQL or JSON
 * 3. View converted output
 */

import { sql } from "@codemirror/lang-sql";
import { format } from "sql-formatter";
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

export function SqlJsonConverterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [direction, setDirection] = useState("sql-to-json");
  const [error, setError] = useState("");

  const convert = useCallback(() => {
    setError("");
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (direction === "sql-to-json") {
        const tables = parseCreateTable(input);
        const formatted = JSON.stringify(tables, null, 2);
        setOutput(formatted);
      } else if (direction === "json-to-sql") {
        const jsonObj = JSON.parse(input);
        const sql = jsonToSql(jsonObj);
        const formatted = format(sql, { language: "sql" });
        setOutput(formatted);
      } else if (direction === "sql-format") {
        const formatted = format(input, { language: "sql" });
        setOutput(formatted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
      setOutput("");
    }
  }, [input, direction]);

  useEffect(() => {
    convert();
  }, [convert]);

  const parseCreateTable = (sql: string) => {
    const tables: Array<{
      name: string;
      columns: Array<{
        name: string;
        type: string;
        primaryKey?: boolean;
        length?: number;
      }>;
    }> = [];
    const createTableRegex = /CREATE TABLE\s+(\w+)\s*\(([^;]+)\)/gi;
    let match;

    while ((match = createTableRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnsStr = match[2];
      const columns: Array<{
        name: string;
        type: string;
        primaryKey?: boolean;
        length?: number;
      }> = [];

      const columnRegex = /(\w+)\s+(\w+)(?:\((\d+)\))?/gi;
      let colMatch;

      while ((colMatch = columnRegex.exec(columnsStr)) !== null) {
        const colName = colMatch[1];
        const colType = colMatch[2].toUpperCase();
        const colLength = colMatch[3] ? parseInt(colMatch[3]) : undefined;

        columns.push({
          name: colName,
          type: colType,
          length: colLength,
          primaryKey: columnsStr
            .toLowerCase()
            .includes(`${colName.toLowerCase()} primary key`),
        });
      }

      tables.push({ name: tableName, columns });
    }

    return { tables };
  };

  const jsonToSql = (json: object) => {
    const data = json as {
      tables?: Array<{
        name: string;
        columns: Array<{
          name: string;
          type: string;
          length?: number;
          primaryKey?: boolean;
        }>;
      }>;
    };
    if (!data.tables) return "";

    let sql = "";

    for (const table of data.tables) {
      sql += `CREATE TABLE ${table.name} (\n`;
      const columnDefs = table.columns.map((col) => {
        let def = `  ${col.name} ${col.type}`;
        if (col.length) def += `(${col.length})`;
        if (col.primaryKey) def += " PRIMARY KEY";
        return def;
      });
      sql += columnDefs.join(",\n");
      sql += "\n);\n\n";
    }

    return sql;
  };

  const handleSample = () => {
    if (direction === "sql-to-json" || direction === "sql-format") {
      setInput(`CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255)
);`);
    } else {
      setInput(`{
  "tables": [
    {
      "name": "users",
      "columns": [
        { "name": "id", "type": "INT", "primaryKey": true },
        { "name": "name", "type": "VARCHAR", "length": 100 },
        { "name": "email", "type": "VARCHAR", "length": 255 }
      ]
    }
  ]
}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isSqlInput = direction !== "json-to-sql";

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">SQL ↔ JSON Converter</h1>
        <p className="text-muted-foreground">
          Convert between SQL and JSON formats
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
              <SelectItem value="sql-to-json">SQL → JSON</SelectItem>
              <SelectItem value="json-to-sql">JSON → SQL</SelectItem>
              <SelectItem value="sql-format">Format SQL</SelectItem>
            </SelectContent>
          </Select>
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
              {isSqlInput ? "Input SQL" : "Input JSON"}
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
                isSqlInput
                  ? "Paste your SQL here..."
                  : "Paste your JSON here..."
              }
              extensions={[sql()]}
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
              {isSqlInput ? "Output JSON" : "Output SQL"}
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
              extensions={[sql()]}
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
