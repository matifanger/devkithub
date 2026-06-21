/**
 * REST API Tester
 *
 * Test REST APIs by sending HTTP requests and viewing responses.
 *
 * Features:
 * - Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Custom headers
 * - Request body (JSON)
 * - Response viewing
 * - Status code display
 * - Response time measurement
 *
 * How to use:
 * 1. Enter the API URL
 * 2. Select HTTP method
 * 3. Add headers if needed
 * 4. Enter request body for POST/PUT/PATCH
 * 5. Click Send to make the request
 */

import axios from "axios";
import React, { useState } from "react";
import { AppCodeMirror } from "../components/app-code-mirror";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolErrorBanner,
} from "../components/tool-page-layout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface Header {
  key: string;
  value: string;
}

export function RestApiTesterPage() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<Header[]>([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    time: number;
    data: unknown;
    headers: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const sendRequest = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    const startTime = Date.now();

    try {
      const headerObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key.trim()) {
          headerObj[h.key.trim()] = h.value;
        }
      });

      const config: Parameters<typeof axios.request>[0] = {
        method,
        url: url.trim(),
        headers: headerObj,
        validateStatus: () => true,
      };

      if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
        config.data = JSON.parse(body);
        if (!headerObj["Content-Type"]) {
          config.headers = {
            ...config.headers,
            "Content-Type": "application/json",
          };
        }
      }

      const res = await axios(config);
      const endTime = Date.now();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: endTime - startTime,
        data: res.data,
        headers: res.headers as Record<string, string>,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300)
      return "bg-green-500/10 border-green-500";
    if (status >= 300 && status < 400)
      return "bg-yellow-500/10 border-yellow-500";
    if (status >= 400 && status < 500)
      return "bg-orange-500/10 border-orange-500";
    return "bg-red-500/10 border-red-500";
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="REST API Tester"
        description="Test REST APIs by sending HTTP requests"
      />

      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>

          <Input
            className="flex-1 min-w-[200px]"
            placeholder="Enter API URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <Button size="sm" onClick={sendRequest} disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUrl("https://httpbin.org/get");
              setMethod("GET");
              setHeaders([{ key: "Accept", value: "application/json" }]);
              setBody("");
            }}
          >
            Sample
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Headers</Label>
          {headers.map((header, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Header name"
                value={header.key}
                onChange={(e) => updateHeader(index, "key", e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Header value"
                value={header.value}
                onChange={(e) => updateHeader(index, "value", e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={() => removeHeader(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addHeader}>
            Add Header
          </Button>
        </div>

        {["POST", "PUT", "PATCH"].includes(method) && (
          <div className="space-y-2">
            <Label>Request Body (JSON)</Label>
            <div className="h-40 border rounded-md overflow-hidden">
              <AppCodeMirror
                value={body}
                onChange={setBody}
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        )}
      </Card>

      <ToolErrorBanner error={error} />

      {response && (
        <div className="space-y-4">
          <Card className={`p-4 ${getStatusColor(response.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-bold">Status:</span>
                <span>
                  {response.status} {response.statusText}
                </span>
              </div>
              <div className="text-muted-foreground">
                Time: {response.time}ms
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <Label>Response Body</Label>
            <pre className="bg-muted p-4 rounded overflow-auto max-h-[400px] text-sm">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </Card>
        </div>
      )}
    </ToolPageContainer>
  );
}
