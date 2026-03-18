/**
 * JSON Schema Validator
 *
 * Validates JSON data against JSON Schema definitions using the Ajv library.
 *
 * Features:
 * - Support for JSON Schema draft-07 and earlier versions
 * - Real-time validation as you type
 * - Detailed error messages with instance paths
 * - Schema formatting and prettifying
 *
 * How to use:
 * 1. Enter or paste your JSON Schema in the left panel
 * 2. Enter the JSON data you want to validate in the right panel
 * 3. View validation results instantly - green check for valid, red errors for invalid
 * 4. Use the Format button to prettify your schema
 */

import { json } from "@codemirror/lang-json";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import React, { useCallback, useEffect, useState } from "react";
import { AppCodeMirror } from "../components/app-code-mirror";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export function JsonSchemaValidatorPage() {
  const [schema, setSchema] = useState("");
  const [data, setData] = useState("");
  const [schemaFormat, setSchemaFormat] = useState("2");
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: Array<{ path: string; message: string }>;
  } | null>(null);

  const ajv = new Ajv({ allErrors: true, verbose: true });
  addFormats(ajv);

  const validate = useCallback(() => {
    setValidationResult(null);

    if (!schema.trim() || !data.trim()) {
      return;
    }

    try {
      const schemaObj = JSON.parse(schema);
      const dataObj = JSON.parse(data);

      const validateFn = ajv.compile(schemaObj);
      const valid = validateFn(dataObj);

      if (valid) {
        setValidationResult({ valid: true, errors: [] });
      } else {
        const errors = (validateFn.errors || []).map((err) => ({
          path: err.instancePath || "/",
          message: err.message || "Validation error",
        }));
        setValidationResult({ valid: false, errors });
      }
    } catch (err) {
      setValidationResult({
        valid: false,
        errors: [
          {
            path: "/",
            message:
              err instanceof Error ? err.message : "Invalid JSON or Schema",
          },
        ],
      });
    }
  }, [schema, data, ajv]);

  useEffect(() => {
    validate();
  }, [validate]);

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(
        JSON.parse(schema),
        null,
        Number(schemaFormat),
      );
      setSchema(formatted);
    } catch {
      // Invalid JSON, ignore
    }
  };

  const handleFormatData = () => {
    try {
      const formatted = JSON.stringify(
        JSON.parse(data),
        null,
        Number(schemaFormat),
      );
      setData(formatted);
    } catch {
      // Invalid JSON, ignore
    }
  };

  const handleSample = () => {
    setSchema(`{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0
    }
  },
  "required": ["name", "email"]
}`);
    setData(`{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">JSON Schema Validator</h1>
        <p className="text-muted-foreground">
          Validate JSON data against JSON Schema definitions
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Spaces:</Label>
          <Select value={schemaFormat} onValueChange={setSchemaFormat}>
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
          Format Schema
        </Button>
        <Button variant="outline" onClick={handleFormatData}>
          Format Data
        </Button>
        <Button variant="outline" onClick={handleSample}>
          Sample
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setSchema("");
            setData("");
          }}
        >
          Clear
        </Button>
      </div>

      {validationResult && (
        <Card
          className={`p-4 ${
            validationResult.valid
              ? "bg-green-500/10 border-green-500"
              : "bg-red-500/10 border-red-500"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${
                validationResult.valid ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="font-medium">
              {validationResult.valid
                ? "Valid JSON"
                : `Invalid - ${validationResult.errors.length} error(s)`}
            </span>
          </div>
          {!validationResult.valid && (
            <ul className="mt-2 space-y-1 text-sm">
              {validationResult.errors.map((err, i) => (
                <li key={i} className="text-red-600 dark:text-red-400">
                  <span className="font-mono">{err.path || "/"}</span>:{" "}
                  {err.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="schema">JSON Schema</Label>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={schema}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              onChange={setSchema}
              placeholder="Enter your JSON Schema..."
              extensions={[json()]}
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
            <Label htmlFor="data">JSON Data</Label>
            {validationResult?.valid && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(data)}
              >
                Copy
              </Button>
            )}
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={data}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              onChange={setData}
              placeholder="Enter JSON data to validate..."
              extensions={[json()]}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
