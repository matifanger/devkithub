import { StreamLanguage } from '@codemirror/language';
import { diff } from '@codemirror/legacy-modes/mode/diff';
import { EditorView } from '@codemirror/view';
import { Change, diffChars, diffLines, diffSentences, diffWords, diffWordsWithSpace } from 'diff';
import { ArrowLeftRight, Clipboard, Copy, Download, Settings, Trash2, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';

interface DiffStats {
  additions: number;
  deletions: number;
  changes: number;
  totalLines: number;
}

interface DiffConfig {
  type: 'lines' | 'words' | 'chars' | 'sentences';
  view: 'split' | 'unified';
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
  collapseUnchanged: boolean;
  contextLines: number;
  showLineNumbers: boolean;
  wrapLines: boolean;
}

const DEFAULT_CONFIG: DiffConfig = {
  type: 'lines',
  view: 'split',
  ignoreCase: false,
  ignoreWhitespace: false,
  collapseUnchanged: false,
  contextLines: 2,
  showLineNumbers: true,
  wrapLines: true,
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

  // Load saved state on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await window.electron.settingsStore.get('tool:text-diff:config');
        const left = await window.electron.settingsStore.get('tool:text-diff:left');
        const right = await window.electron.settingsStore.get('tool:text-diff:right');
        if (saved) setConfig((prev) => ({ ...prev, ...JSON.parse(saved) }));
        if (left) setText1(left);
        if (right) setText2(right);
      } catch (err) {
        console.warn('Failed to load saved Text Diff settings/state', err);
      }
    })();
  }, []);

  const calculateDiff = useCallback(() => {
    let differences: Change[] = [];
    if (config.type === 'chars') {
      differences = diffChars(text1, text2, {
        ignoreCase: config.ignoreCase,
      });
    } else if (config.type === 'words') {
      differences = (config.ignoreWhitespace ? diffWords : diffWordsWithSpace)(text1, text2, {
        ignoreCase: config.ignoreCase,
      });
    } else if (config.type === 'sentences') {
      differences = diffSentences(text1, text2, {
        ignoreCase: config.ignoreCase,
      });
    } else {
      differences = diffLines(text1, text2, {
        ignoreCase: config.ignoreCase,
        ignoreWhitespace: config.ignoreWhitespace,
      });
    }

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

  // Persist state (debounced-ish via effect)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        window.electron.settingsStore.set('tool:text-diff:config', JSON.stringify(config));
        window.electron.settingsStore.set('tool:text-diff:left', text1);
        window.electron.settingsStore.set('tool:text-diff:right', text2);
      } catch (err) {
        console.warn('Failed to persist Text Diff settings/state', err);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [config, text1, text2]);

  const loadSampleText = () => {
    setText1(SAMPLE_TEXT_1);
    setText2(SAMPLE_TEXT_2);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const updateConfig = <K extends keyof DiffConfig>(key: K, value: DiffConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const formatDiffOutput = useCallback(
    (diffs: Change[]) => {
      // Build a unified diff-like output
      const renderedLines: string[] = [];
      let buffer: { type: 'context' | 'hunk'; lines: string[] } = { type: 'context', lines: [] };

      const flush = () => {
        if (!config.collapseUnchanged || buffer.type === 'hunk') {
          renderedLines.push(...buffer.lines);
        } else {
          // Collapse long context blocks
          if (buffer.lines.length > config.contextLines * 2 + 1) {
            const head = buffer.lines.slice(0, config.contextLines);
            const tail = buffer.lines.slice(buffer.lines.length - config.contextLines);
            renderedLines.push(...head);
            renderedLines.push('… \n');
            renderedLines.push(...tail);
          } else {
            renderedLines.push(...buffer.lines);
          }
        }
        buffer = { type: 'context', lines: [] };
      };

      diffs.forEach((part) => {
        const lines = part.value.split('\n');
        lines.forEach((line, index) => {
          if (index === lines.length - 1 && line === '') return;
          const prefix = part.added ? '+' : part.removed ? '-' : ' ';
          const isContext = !part.added && !part.removed;
          if (isContext) {
            if (buffer.type === 'hunk') flush();
            buffer.type = 'context';
            buffer.lines.push(prefix + ' ' + line);
          } else {
            if (buffer.type === 'context' && buffer.lines.length) flush();
            buffer.type = 'hunk';
            buffer.lines.push(prefix + ' ' + line);
          }
        });
      });
      if (buffer.lines.length) flush();

      return renderedLines.join('\n');
    },
    [config.collapseUnchanged, config.contextLines]
  );

  const handleSwap = () => {
    setText1(text2);
    setText2(text1);
  };

  const handlePasteLeft = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setText1(t);
    } catch (err) {
      console.warn('Clipboard read failed (left editor)', err);
    }
  };

  const handlePasteRight = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setText2(t);
    } catch (err) {
      console.warn('Clipboard read failed (right editor)', err);
    }
  };

  const handleClear = () => {
    setText1('');
    setText2('');
  };

  const handleDownload = () => {
    const blob = new Blob([formatDiffOutput(diffResult)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diff.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onLoadFile = (event: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      if (side === 'left') setText1(value);
      else setText2(value);
    };
    reader.readAsText(file);
    event.currentTarget.value = '';
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSwap();
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        updateConfig('ignoreWhitespace', !config.ignoreWhitespace);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [config.ignoreWhitespace, text1, text2]);

  const unifiedOutput = useMemo(() => formatDiffOutput(diffResult), [diffResult, formatDiffOutput]);

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Text Diff Checker</h1>
        <p className="text-muted-foreground">Compare two texts and highlight their differences</p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>Granularity</Label>
            <Select
              value={config.type}
              onValueChange={(value: DiffConfig['type']) => updateConfig('type', value)}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lines">Lines</SelectItem>
                <SelectItem value="words">Words</SelectItem>
                <SelectItem value="chars">Characters</SelectItem>
                <SelectItem value="sentences">Sentences</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>View</Label>
            <Select
              value={config.view}
              onValueChange={(value: DiffConfig['view']) => updateConfig('view', value)}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Select View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="split">Side by Side</SelectItem>
                <SelectItem value="unified">Unified</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch
              checked={config.ignoreWhitespace}
              onCheckedChange={(v) => updateConfig('ignoreWhitespace', v)}
            />
            <span className="text-sm">Ignore whitespace</span>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch
              checked={config.ignoreCase}
              onCheckedChange={(v) => updateConfig('ignoreCase', v)}
            />
            <span className="text-sm">Ignore case</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadSampleText}>
            <Settings className="w-4 h-4 mr-2" /> Sample
          </Button>
          <Button variant="outline" onClick={handleSwap} title="Swap (Ctrl+Shift+S)">
            <ArrowLeftRight className="w-4 h-4 mr-2" /> Swap
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Collapse unchanged</span>
                  <Switch
                    checked={config.collapseUnchanged}
                    onCheckedChange={(v) => updateConfig('collapseUnchanged', v)}
                  />
                </div>
                <div>
                  <Label>Context lines</Label>
                  <Select
                    value={String(config.contextLines)}
                    onValueChange={(v) => updateConfig('contextLines', Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Editor line numbers</span>
                  <Switch
                    checked={config.showLineNumbers}
                    onCheckedChange={(v) => updateConfig('showLineNumbers', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Editor wrap lines</span>
                  <Switch
                    checked={config.wrapLines}
                    onCheckedChange={(v) => updateConfig('wrapLines', v)}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Original Text</Label>
            <div className="space-x-2">
              <input
                type="file"
                accept=".txt,.md,.json,.log,.csv,.xml,.html,.js,.ts,.css,.scss,.yml,.yaml"
                className="hidden"
                id="load-left"
                onChange={(e) => onLoadFile(e, 'left')}
              />
              <Button variant="outline" size="sm" onClick={handlePasteLeft}>
                <Clipboard className="w-4 h-4 mr-2" />
                Clipboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('load-left')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Load
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyText(text1)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
          <AppCodeMirror
            value={text1}
            height="400px"
            onChange={setText1}
            extensions={config.wrapLines ? [EditorView.lineWrapping] : []}
            basicSetup={{
              lineNumbers: config.showLineNumbers,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Modified Text</Label>
            <div className="space-x-2">
              <input
                type="file"
                accept=".txt,.md,.json,.log,.csv,.xml,.html,.js,.ts,.css,.scss,.yml,.yaml"
                className="hidden"
                id="load-right"
                onChange={(e) => onLoadFile(e, 'right')}
              />
              <Button variant="outline" size="sm" onClick={handlePasteRight}>
                <Clipboard className="w-4 h-4 mr-2" />
                Clipboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('load-right')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Load
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyText(text2)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
          <AppCodeMirror
            value={text2}
            height="400px"
            onChange={setText2}
            extensions={config.wrapLines ? [EditorView.lineWrapping] : []}
            basicSetup={{
              lineNumbers: config.showLineNumbers,
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
            <span>
              Additions: <span className="text-green-500">{stats.additions}</span>
            </span>
            <span>
              Deletions: <span className="text-red-500">{stats.deletions}</span>
            </span>
            <span>
              Changes: <span className="text-blue-500">{stats.changes}</span>
            </span>
            <span>Total Lines: {stats.totalLines}</span>
          </div>
        </div>
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => copyText(unifiedOutput)}>
              <Copy className="w-4 h-4 mr-2" /> Copy diff
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Download diff
            </Button>
          </div>
          {config.view === 'unified' && (
            <AppCodeMirror
              value={unifiedOutput}
              height="240px"
              extensions={[EditorView.lineWrapping, StreamLanguage.define(diff)]}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
              }}
            />
          )}
          {config.view === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-md border border-border bg-background p-3 overflow-auto h-60">
                <pre className="text-sm whitespace-pre-wrap leading-5">
                  {diffResult.map((part, idx) => {
                    const cls = part.removed
                      ? 'bg-red-500/10 text-red-500'
                      : part.added
                        ? 'bg-green-500/10 text-green-600'
                        : '';
                    const val = part.removed || (!part.added && !part.removed) ? part.value : '';
                    return (
                      <span key={idx} className={cls}>
                        {val}
                      </span>
                    );
                  })}
                </pre>
              </div>
              <div className="rounded-md border border-border bg-background p-3 overflow-auto h-60">
                <pre className="text-sm whitespace-pre-wrap leading-5">
                  {diffResult.map((part, idx) => {
                    const cls = part.added
                      ? 'bg-green-500/10 text-green-600'
                      : part.removed
                        ? 'bg-red-500/10 text-red-500'
                        : '';
                    const val = part.added || (!part.added && !part.removed) ? part.value : '';
                    return (
                      <span key={idx} className={cls}>
                        {val}
                      </span>
                    );
                  })}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
