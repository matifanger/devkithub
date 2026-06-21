import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import React, { useCallback, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { ToolCopyButton, ToolClearButton } from '../components/tool-actions';
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolEditorGrid,
  ToolErrorBanner,
} from '../components/tool-page-layout';
import { Button } from '../components/ui/button';

export function HtmlToJsxPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const convertHtmlToJsx = useCallback((html: string) => {
    try {
      if (!html.trim()) {
        setOutput('');
        setError('');
        return;
      }

      // Basic HTML to JSX conversion rules
      const jsx = html
        // Convert class to className
        .replace(/class=/g, 'className=')
        // Convert for to htmlFor
        .replace(/for=/g, 'htmlFor=')
        // Convert style strings to objects
        .replace(/style="([^"]*)"/g, (match: string, styles: string) => {
          const styleObject = styles
            .split(';')
            .filter(Boolean)
            .map((style: string) => {
              const [property, value] = style.split(':').map((s: string) => s.trim());
              // Convert kebab-case to camelCase
              const camelProperty = property.replace(/-([a-z])/g, (g: string) =>
                g[1].toUpperCase()
              );
              return `${camelProperty}: "${value}"`;
            })
            .join(', ');
          return `style={{${styleObject}}}`;
        })
        // Self-closing tags
        .replace(
          /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>]*?)>/g,
          '<$1$2 />'
        )
        // Convert inline event handlers
        .replace(/on([a-z]+)="([^"]*)"/gi, (match, event, handler) => {
          return `on${event.charAt(0).toUpperCase() + event.slice(1)}={() => ${handler}}`;
        });

      setOutput(jsx);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid HTML');
      setOutput('');
    }
  }, []);

  const handleSample = () => {
    const sample = `<div class="container">
  <h1 class="title" style="color: blue; font-size: 24px;">
    Hello World
  </h1>
  <label for="name">Name:</label>
  <input type="text" id="name" class="input" />
  <button onclick="handleClick()">
    Click me
  </button>
  <img src="image.jpg" alt="Sample image">
</div>`;
    setInput(sample.trim());
    convertHtmlToJsx(sample.trim());
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      convertHtmlToJsx(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="HTML to JSX Converter"
        description="Convert HTML code to JSX format"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="Input HTML"
          actions={
            <>
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <ToolClearButton onClear={handleClear} />
            </>
          }
        >
          <AppCodeMirror
            value={input}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            extensions={[html()]}
            onChange={(value) => {
              setInput(value);
              convertHtmlToJsx(value);
            }}
            placeholder="Paste your HTML here"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="Output JSX"
          actions={<ToolCopyButton value={output} />}
        >
          {error ? (
            <ToolErrorBanner error={error} />
          ) : (
            <AppCodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              extensions={[javascript({ jsx: true })]}
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
