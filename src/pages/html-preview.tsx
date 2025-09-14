import { html } from '@codemirror/lang-html';
import React, { useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export function HtmlPreviewPage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSample = () => {
    const sample = `<!DOCTYPE html>
<html>
<head>
  <title>Sample HTML</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
    }
    .container {
      padding: 20px;
      border-radius: 4px;
    }
    .header {
      background-color: #f5f5f5;
      padding: 10px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .button {
      background-color: #007bff;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .button:hover {
      background-color: #0056b3;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HTML Sample</h1>
      <p>This is a sample HTML document with various elements and styles.</p>
    </div>

    <h2>Form Elements</h2>
    <form>
      <div>
        <label for="name">Name:</label>
        <input type="text" id="name" placeholder="Enter your name">
      </div>
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" placeholder="Enter your email">
      </div>
      <button class="button" type="submit">Submit</button>
    </form>

    <h2>Table Example</h2>
    <table>
      <thead>
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
          <th>Header 3</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Row 1, Cell 1</td>
          <td>Row 1, Cell 2</td>
          <td>Row 1, Cell 3</td>
        </tr>
        <tr>
          <td>Row 2, Cell 1</td>
          <td>Row 2, Cell 2</td>
          <td>Row 2, Cell 3</td>
        </tr>
      </tbody>
    </table>

    <h2>List Example</h2>
    <ul>
      <li>Item 1</li>
      <li>Item 2
        <ul>
          <li>Subitem 2.1</li>
          <li>Subitem 2.2</li>
        </ul>
      </li>
      <li>Item 3</li>
    </ul>
  </div>
</body>
</html>`;
    setInput(sample.trim());
  };

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">HTML Preview</h1>
        <p className="text-muted-foreground">Live preview of HTML content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Input HTML</Label>
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
              <Button variant="outline" onClick={() => copyToClipboard(input)}>
                Copy
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              extensions={[html()]}
              onChange={setInput}
              placeholder="Write your HTML here"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mt-3 mb-[18px]">
            <Label>Preview</Label>
          </div>

          {error ? (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4">{error}</div>
          ) : (
            <div className="relative h-[calc(100vh-17rem)] bg-transparent dark:bg-zinc-900 rounded-lg border">
              <iframe
                srcDoc={input}
                title="HTML Preview"
                className="absolute inset-0 w-full h-full"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
