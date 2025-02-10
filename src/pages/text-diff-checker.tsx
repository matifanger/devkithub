import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { Copy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { diffLines, diffChars, Change } from 'diff';
import { StreamLanguage } from '@codemirror/language';
import { diff } from '@codemirror/legacy-modes/mode/diff';

interface DiffStats {
  additions: number;
  deletions: number;
  changes: number;
  totalLines: number;
}

interface DiffConfig {
  type: 'chars' | 'lines';
  view: 'split' | 'unified';
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
}

const DEFAULT_CONFIG: DiffConfig = {
  type: 'lines',
  view: 'split',
  ignoreCase: false,
  ignoreWhitespace: false,
};

const SAMPLE_TEXT_1 = `// JavaScript Function Example
function hello(name) {
  console.log("Hello " + name);
  return true;
}

// Plain Text Example
This is the first version of the text.
It has some lines that will be changed.
This line will remain the same.

// JSON Example
{
  "name": "John",
  "age": 30,
  "city": "New York"
}

// Configuration File Example
[settings]
theme = light
font_size = 12
auto_save = true

// HTML Example
<div>
  <h1>Welcome</h1>
  <p>This is a simple HTML example.</p>
</div>

// Markdown Example
# Title
This is a simple markdown example.
- Item 1
- Item 2
`;

const SAMPLE_TEXT_2 = `// JavaScript Function Example
function hello(name) {
  // Add greeting
  console.log(\`Hello \${name}!\`);
  return true;
}

// Plain Text Example
This is the updated version of the text.
It has some lines that were changed.
This line will remain the same.

// JSON Example
{
  "name": "John",
  "age": 31,
  "city": "San Francisco"
}

// Configuration File Example
[settings]
theme = dark
font_size = 14
auto_save = false

// HTML Example
<div>
  <h1>Welcome</h1>
  <p>This is an <strong>updated</strong> HTML example.</p>
</div>

// Markdown Example
# Title
This is an **updated** markdown example.
- Item 1
- Item 2
- Item 3
`;

export function TextDiffCheckerPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [config, setConfig] = useState<DiffConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<DiffStats>({
    additions: 0,
    deletions: 0,
    changes: 0,
    totalLines: 0,
  });
  const [diffResult, setDiffResult] = useState<Change[]>([]);

  const calculateDiff = useCallback(() => {
    const differences = config.type === 'chars' 
      ? diffChars(text1, text2, {
          ignoreCase: config.ignoreCase,
        })
      : diffLines(text1, text2, {
          ignoreCase: config.ignoreCase,
          ignoreWhitespace: config.ignoreWhitespace,
        });

    let additions = 0;
    let deletions = 0;
    let changes = 0;

    differences.forEach((part: Change) => {
      if (part.added) additions += part.count || 0;
      if (part.removed) deletions += part.count || 0;
      if (!part.added && !part.removed) changes += part.count || 0;
    });

    setStats({
      additions,
      deletions,
      changes,
      totalLines: text1.split('\n').length + text2.split('\n').length,
    });

    setDiffResult(differences);
  }, [text1, text2, config]);

  useEffect(() => {
    calculateDiff();
  }, [text1, text2, config, calculateDiff]);

  const loadSampleText = () => {
    setText1(SAMPLE_TEXT_1);
    setText2(SAMPLE_TEXT_2);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const updateConfig = <K extends keyof DiffConfig>(key: K, value: DiffConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const formatDiffOutput = useCallback((diffs: Change[]) => {
    let output = '';

    diffs.forEach((part) => {
      const lines = part.value.split('\n');
      lines.forEach((line, index) => {
        if (index === lines.length - 1 && line === '') return;
        
        const prefix = part.added ? '+' : part.removed ? '-' : ' ';
        output += prefix + ' ' + line + '\n';
      });
    });

    return output;
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Text Diff Checker</h1>
        <p className="text-muted-foreground">Compare two texts and highlight their differences</p>
      </div>

      <div className="flex items-end gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Diff Type</Label>
            <Select value={config.type} onValueChange={(value: DiffConfig['type']) => updateConfig('type', value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lines">Line by Line</SelectItem>
                <SelectItem value="chars">Character by Character</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>View Mode</Label>
            <Select value={config.view} onValueChange={(value: DiffConfig['view']) => updateConfig('view', value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="split">Side by Side</SelectItem>
                <SelectItem value="unified">Unified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" onClick={loadSampleText}>
          Load Sample
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Original Text</Label>
            <Button variant="outline" size="sm" onClick={() => copyText(text1)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <CodeMirror
            value={text1}
            height="400px"
            theme={oneDark}
            onChange={setText1}
            extensions={[EditorView.lineWrapping]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Modified Text</Label>
            <Button variant="outline" size="sm" onClick={() => copyText(text2)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <CodeMirror
            value={text2}
            height="400px"
            theme={oneDark}
            onChange={setText2}
            extensions={[EditorView.lineWrapping]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Diff Output</Label>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Additions: <span className="text-green-500">{stats.additions}</span></span>
            <span>Deletions: <span className="text-red-500">{stats.deletions}</span></span>
            <span>Changes: <span className="text-blue-500">{stats.changes}</span></span>
            <span>Total Lines: {stats.totalLines}</span>
          </div>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <style>
            {`
              .cm-line { padding: 0 4px !important; }
              .cm-diff-add { background-color: rgba(34, 197, 94, 0.2) !important; color: rgb(34, 197, 94) !important; }
              .cm-diff-remove { background-color: rgba(239, 68, 68, 0.2) !important; color: rgb(239, 68, 68) !important; }
            `}
          </style>
          <CodeMirror
            value={formatDiffOutput(diffResult)}
            height="200px"
            theme={oneDark}
            extensions={[
              EditorView.lineWrapping,
              StreamLanguage.define(diff)
            ]}
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
  );
} 