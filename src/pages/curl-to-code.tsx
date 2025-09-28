import { javascript } from '@codemirror/lang-javascript';
import { php } from '@codemirror/lang-php';
import { python } from '@codemirror/lang-python';
import { StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { EditorView } from '@uiw/react-codemirror';
import React, { useCallback, useEffect, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function CurlToCodePage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('javascript');
  const [convertedCode, setConvertedCode] = useState('');

  const convertCurlToCode = useCallback((curl: string, language: string): string => {
    try {
      if (!curl.trim()) {
        setError('');
        return '';
      }

      // Extract components from curl command
      const urlMatch = curl.match(/curl .*?['"]?(https?:\/\/[^'"\\s]+)['"]?/);
      const methodMatch = curl.match(/-X\s+(['"]?)(\w+)\1/);
      const headersMatch = curl.match(/-H\s+(['"])(.*?)\1/g);
      const dataMatch = curl.match(/--data\s+(['"])(.*?)\1/);
      const jsonMatch = curl.match(/--json\s+(['"])(.*?)\1/);

      if (!urlMatch) {
        throw new Error('Invalid CURL command: URL not found');
      }

      const url = urlMatch[1];
      const method = methodMatch ? methodMatch[2] : 'GET';
      const headers = headersMatch ? headersMatch.map((h) => h.match(/-H\s+(['"])(.*?)\1/)[2]) : [];
      const data = dataMatch ? dataMatch[2] : jsonMatch ? jsonMatch[2] : null;

      setError('');
      // Convert to specified language
      switch (language) {
        case 'javascript':
          return generateJavaScript(url, method, headers, data);
        case 'python':
          return generatePython(url, method, headers, data);
        case 'php':
          return generatePHP(url, method, headers, data);
        case 'go':
          return generateGo(url, method, headers, data);
        default:
          throw new Error('Unsupported language');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid CURL command');
      return '';
    }
  }, []);

  // Update converted code when input or activeTab changes
  useEffect(() => {
    const result = convertCurlToCode(input, activeTab);
    setConvertedCode(result);
  }, [input, activeTab, convertCurlToCode]);

  const generateJavaScript = (
    url: string,
    method: string,
    headers: string[],
    data: string | null
  ): string => {
    const headerObj = headers.reduce((acc, header) => {
      const [key, value] = header.split(': ');
      return { ...acc, [key]: value };
    }, {});

    return `// Using Fetch API
const response = await fetch("${url}", {
  method: "${method}",
  headers: ${JSON.stringify(headerObj, null, 2)},${data ? `\n  body: '${data}',` : ''}
});

const data = await response.json();
console.log(data);

// Using Axios
const axios = require('axios');

const response = await axios({
  url: "${url}",
  method: "${method}",
  headers: ${JSON.stringify(headerObj, null, 2)},${data ? `\n  data: ${data},` : ''}
});

console.log(response.data);`;
  };

  const generatePython = (
    url: string,
    method: string,
    headers: string[],
    data: string | null
  ): string => {
    const headerDict = headers.reduce((acc, header) => {
      const [key, value] = header.split(': ');
      return { ...acc, [key]: value };
    }, {});

    return `# Using requests
import requests

headers = ${JSON.stringify(headerDict, null, 4)}

response = requests.${method.toLowerCase()}(
    "${url}",
    headers=headers,${data ? `\n    data='${data}',` : ''}
)

print(response.json())

# Using httpx (async)
import httpx
import asyncio

async def make_request():
    async with httpx.AsyncClient() as client:
        response = await client.${method.toLowerCase()}(
            "${url}",
            headers=${JSON.stringify(headerDict, null, 4)},${data ? `\n            data='${data}',` : ''}
        )
        return response.json()

result = asyncio.run(make_request())
print(result)`;
  };

  const generatePHP = (
    url: string,
    method: string,
    headers: string[],
    data: string | null
  ): string => {
    const headerStr = headers.map((h) => `  "${h}"`).join(',\n');

    return `<?php
// Using cURL
$ch = curl_init();

curl_setopt_array($ch, [
  CURLOPT_URL => "${url}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "${method}",
  CURLOPT_HTTPHEADER => [
${headerStr}
  ],${data ? `\n  CURLOPT_POSTFIELDS => '${data}',` : ''}
]);

$response = curl_exec($ch);
$data = json_decode($response, true);

curl_close($ch);
print_r($data);

// Using Guzzle
use GuzzleHttp\\Client;

$client = new Client();
$response = $client->request("${method}", "${url}", [
  'headers' => ${JSON.stringify(
    headers.reduce((acc, header) => {
      const [key, value] = header.split(': ');
      return { ...acc, [key]: value };
    }, {}),
    null,
    4
  )},${data ? `\n  'body' => '${data}',` : ''}
]);

$data = json_decode($response->getBody(), true);
print_r($data);`;
  };

  const generateGo = (
    url: string,
    method: string,
    headers: string[],
    data: string | null
  ): string => {
    const headerStr = headers
      .map((h) => {
        const [key, value] = h.split(': ');
        return `\treq.Header.Add("${key}", "${value}")`;
      })
      .join('\n');

    return `package main

import (
    "fmt"
    "io/ioutil"
    "net/http"${data ? '\n    "strings"' : ''}
)

func main() {${data ? `\n    payload := strings.NewReader(\`${data}\`)` : ''}
    req, err := http.NewRequest("${method}", "${url}", ${data ? 'payload' : 'nil'})
    if err != nil {
        panic(err)
    }

${headerStr}

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        panic(err)
    }

    fmt.Println(string(body))
}`;
  };

  const handleSample = useCallback(() => {
    const sample = `curl -X POST "https://api.example.com/v1/users" -H "Content-Type: application/json" -H "Authorization: Bearer token123" --data '{"name": "John Doe", "email": "john@example.com"}'`;
    setInput(sample);
  }, []);

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getLanguageExtension = (language: string) => {
    switch (language) {
      case 'javascript':
        return javascript();
      case 'python':
        return python();
      case 'php':
        return php();
      default:
        return javascript();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">CURL to Code</h1>
        <p className="text-muted-foreground">
          Convert CURL commands to various programming languages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="input">CURL Command</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <Button variant="outline" onClick={() => setInput('')}>
                Clear
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              extensions={[StreamLanguage.define(shell), EditorView.lineWrapping]}
              onChange={(value) => setInput(value)}
              placeholder="Enter your CURL command here"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Generated Code</Label>
            <div className="flex items-center space-x-2">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => copyToClipboard(convertedCode)}>
                Copy
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={convertedCode}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              width="100%"
              extensions={[getLanguageExtension(activeTab)]}
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
