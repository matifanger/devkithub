import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkGemoji from 'remark-gemoji';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

export function MarkdownPreviewPage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSample = () => {
    const sample = `# Markdown Sample

## Headers

# H1
## H2
### H3
#### H4
##### H5
###### H6

## Emphasis

*This text will be italic*
_This will also be italic_

**This text will be bold**
__This will also be bold__

_You **can** combine them_

~~This text will be strikethrough~~

## Lists

### Unordered
* Item 1
* Item 2
  * Item 2a
  * Item 2b

### Ordered
1. Item 1
2. Item 2
3. Item 3
   * Item 3a
   * Item 3b

## Links

[GitHub](http://github.com)
[Link with title](http://github.com "GitHub's Homepage")

## Images
<svg height="32" aria-hidden="true" viewBox="0 0 24 24" version="1.1" width="32" data-view-component="true" class="octicon octicon-mark-github v-align-middle">
    <path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z"></path>
</svg>

## Blockquotes

> This is a blockquote.
> 
> It can span multiple lines.

> Blockquotes can be nested
>> Like this
>>> And this

## Tables

| Feature | Support | Notes |
|---------|---------|-------|
| Tables | ✓ | Pipes and alignment |
| Alignment | ✓ | :---:, :---, or ---: |
| Escaping | ✓ | \\| for escaping pipe |

## Code

Inline \`code\` has \`back-ticks around\` it.

\`\`\`javascript
// Syntax highlighted code block
function example() {
  console.log("Hello, World!");
}
\`\`\`

\`\`\`python
# Python code
def hello_world():
    print("Hello, World!")
\`\`\`

## Task Lists

- [x] This is a complete item
- [ ] This is an incomplete item
- [x] @mentions, #refs, [links](), **formatting**, and <del>tags</del> supported
- [ ] list syntax required (any unordered or ordered list supported)

## Math

Inline math: $a \\ne 0$

Block math:

$$
x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}
$$

## Emojis

:smile: :heart: :thumbsup:

## Horizontal Rules

Three or more...

---
Hyphens

***
Asterisks

___
Underscores

## Footnotes

Here is a footnote reference,[^1] and another.[^longnote]

[^1]: Here is the footnote.

[^longnote]: Here's one with multiple blocks.

    Subsequent paragraphs are indented to show that they
belong to the previous footnote.

## HTML Support

<details>
<summary>Click to expand!</summary>

### This is a collapsible section
You can hide content in here.
</details>

<kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Delete</kbd>

<mark>Highlighted text</mark>

<sup>Superscript</sup> and <sub>subscript</sub>`;
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
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Markdown Preview</h1>
        <p className="text-muted-foreground">Live preview of Markdown content</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Input Markdown</Label>
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
            <CodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              theme={oneDark}
              extensions={[markdown()]}
              onChange={setInput}
              placeholder="Write your Markdown here"
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
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          ) : (
            <div className="relative h-[calc(100vh-17rem)] bg-white dark:bg-zinc-900 border">
              <div className="absolute inset-0 overflow-auto p-4 prose prose-sm md:prose-base dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[
                    remarkGfm,
                    remarkMath,
                    remarkGemoji,
                  ]}
                  rehypePlugins={[
                    rehypeRaw,
                    rehypeHighlight,
                    [rehypeKatex, { strict: false }]
                  ]}
                  components={{
                    code(props) {
                      const {className, children} = props;
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <div className="relative">
                          <pre>
                            <code className={className}>{children}</code>
                          </pre>
                        </div>
                      ) : (
                        <code className={className}>{children}</code>
                      );
                    },
                    img(props) {
                      return <img {...props} className="rounded-lg shadow-md" />;
                    },
                    table(props) {
                      return <table {...props} className="border-collapse table-auto w-full my-4" />;
                    },
                    th(props) {
                      return <th {...props} className="border dark:border-zinc-700 px-6 py-3 bg-gray-50 dark:bg-zinc-800" />;
                    },
                    td(props) {
                      return <td {...props} className="border dark:border-zinc-700 px-6 py-3" />;
                    },
                    input(props) {
                      return props.type === 'checkbox' ? (
                        <input {...props} disabled className="w-4 h-4 mr-1 rounded border-gray-300" />
                      ) : (
                        <input {...props} />
                      );
                    },
                    dl(props) {
                      return <dl {...props} className="mt-4" />;
                    },
                    dt(props) {
                      return <dt {...props} className="font-bold mt-2" />;
                    },
                    dd(props) {
                      return <dd {...props} className="ml-4 mt-1" />;
                    },
                    kbd(props) {
                      return (
                        <kbd
                          {...props}
                          className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                        />
                      );
                    },
                    mark(props) {
                      return <mark {...props} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded" />;
                    }
                  }}
                >
                  {input}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 