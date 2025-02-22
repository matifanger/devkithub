import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { Copy, Settings, Book } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

interface RegExpFlags {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  sticky: boolean;
}

interface Match {
  text: string;
  index: number;
  groups: { [key: string]: string } | null;
}

const DEFAULT_FLAGS: RegExpFlags = {
  global: true,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
  sticky: false,
};

const SAMPLE_PATTERNS = [
  {
    name: 'Email',
    pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
    text: 'test@example.com\ninvalid.email@com\nanother.valid@sub.domain.com'
  },
  {
    name: 'URL',
    pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)',
    text: 'https://www.example.com\nhttp://subdomain.site.com/path?param=1\nNot a URL\nhttps://invalid.'
  },
  {
    name: 'Date (YYYY-MM-DD)',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
    text: '2024-01-31\n2023-13-01\n2024-02-30'
  }
];

const CHEAT_SHEET = [
  { category: "Character Classes", items: [
    { pattern: ".", description: "Any character except newline" },
    { pattern: "\\w", description: "Word character [a-zA-Z0-9_]" },
    { pattern: "\\d", description: "Digit [0-9]" },
    { pattern: "\\s", description: "Whitespace character" },
    { pattern: "[abc]", description: "Single character (a or b or c)" },
    { pattern: "[^abc]", description: "Single character (not a, b, or c)" },
  ]},
  { category: "Anchors", items: [
    { pattern: "^", description: "Start of line" },
    { pattern: "$", description: "End of line" },
    { pattern: "\\b", description: "Word boundary" },
  ]},
  { category: "Quantifiers", items: [
    { pattern: "*", description: "0 or more" },
    { pattern: "+", description: "1 or more" },
    { pattern: "?", description: "0 or 1" },
    { pattern: "{n}", description: "Exactly n times" },
    { pattern: "{n,}", description: "n or more times" },
    { pattern: "{n,m}", description: "Between n and m times" },
  ]},
  { category: "Groups", items: [
    { pattern: "(abc)", description: "Capturing group" },
    { pattern: "(?:abc)", description: "Non-capturing group" },
    { pattern: "(?<name>abc)", description: "Named capturing group" },
  ]},
];

export function RegexTesterPage() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<RegExpFlags>(DEFAULT_FLAGS);
  const [text, setText] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState('');
  const [matchFilter, setMatchFilter] = useState('');

  const getFlagsString = useCallback(() => {
    return (flags.global ? 'g' : '') +
           (flags.ignoreCase ? 'i' : '') +
           (flags.multiline ? 'm' : '') +
           (flags.dotAll ? 's' : '') +
           (flags.unicode ? 'u' : '') +
           (flags.sticky ? 'y' : '');
  }, [flags]);

  const updateMatches = useCallback(() => {
    if (!pattern || !text) {
      setMatches([]);
      setError('');
      return;
    }

    try {
      const regex = new RegExp(pattern, getFlagsString());
      const newMatches: Match[] = [];
      
      if (flags.global) {
        let match;
        while ((match = regex.exec(text)) !== null) {
          newMatches.push({
            text: match[0],
            index: match.index,
            groups: match.groups
          });
        }
      } else {
        const match = regex.exec(text);
        if (match) {
          newMatches.push({
            text: match[0],
            index: match.index,
            groups: match.groups
          });
        }
      }

      setMatches(newMatches);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid regular expression');
      setMatches([]);
    }
  }, [pattern, text, flags, getFlagsString]);

  useEffect(() => {
    updateMatches();
  }, [pattern, text, flags, updateMatches]);

  const loadSample = (sample: typeof SAMPLE_PATTERNS[0]) => {
    setPattern(sample.pattern);
    setText(sample.text);
  };

  const toggleFlag = (key: keyof RegExpFlags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getMatchesOutput = useCallback(() => {
    if (error) return error;
    if (!matches.length) return 'No matches found';

    let output = `Found ${matches.length} match${matches.length !== 1 ? 'es' : ''}\n\n`;
    
    matches.forEach((match, index) => {
      if (matchFilter && !String(index).match(new RegExp(matchFilter))) return;
      
      output += `Match ${index + 1}:\n`;
      output += `  Text: ${match.text}\n`;
      output += `  Index: ${match.index}\n`;
      if (match.groups && Object.keys(match.groups).length > 0) {
        output += `  Groups:\n${JSON.stringify(match.groups, null, 2).split('\n').map(line => '    ' + line).join('\n')}\n`;
      }
      output += '\n';
    });

    return output;
  }, [matches, error, matchFilter]);

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Regular Expression Tester</h1>
        <p className="text-muted-foreground">Test and debug regular expressions with real-time matching</p>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Label>Pattern</Label>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Book className="w-4 h-4 mr-2" />
                    Cheat Sheet
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Regular Expression Cheat Sheet</DialogTitle>
                    <DialogDescription>
                      Common patterns and their descriptions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {CHEAT_SHEET.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <h3 className="font-medium">{category.category}</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {category.items.map((item) => (
                            <div key={item.pattern} className="p-2 bg-muted rounded-lg">
                              <code className="text-sm font-mono">{item.pattern}</code>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Flags
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Flags</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure regex flags
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="global">Global (g)</Label>
                        <Switch
                          id="global"
                          checked={flags.global}
                          onCheckedChange={() => toggleFlag('global')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ignoreCase">Ignore Case (i)</Label>
                        <Switch
                          id="ignoreCase"
                          checked={flags.ignoreCase}
                          onCheckedChange={() => toggleFlag('ignoreCase')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="multiline">Multiline (m)</Label>
                        <Switch
                          id="multiline"
                          checked={flags.multiline}
                          onCheckedChange={() => toggleFlag('multiline')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dotAll">Dot All (s)</Label>
                        <Switch
                          id="dotAll"
                          checked={flags.dotAll}
                          onCheckedChange={() => toggleFlag('dotAll')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="unicode">Unicode (u)</Label>
                        <Switch
                          id="unicode"
                          checked={flags.unicode}
                          onCheckedChange={() => toggleFlag('unicode')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sticky">Sticky (y)</Label>
                        <Switch
                          id="sticky"
                          checked={flags.sticky}
                          onCheckedChange={() => toggleFlag('sticky')}
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Select
                value=""
                onValueChange={(value) => loadSample(SAMPLE_PATTERNS[parseInt(value)])}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Load Sample" />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_PATTERNS.map((sample, index) => (
                    <SelectItem key={sample.name} value={index.toString()}>
                      {sample.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regular expression pattern"
            className="font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Test Text</Label>
        <CodeMirror
          value={text}
          height="200px"
          theme={oneDark}
          onChange={setText}
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
          <Label>Match Information</Label>
          <div className="flex items-center gap-2">
            <Input
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value)}
              placeholder="Filter matches (e.g. $0)"
              className="w-[200px]"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigator.clipboard.writeText(getMatchesOutput())}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>
        <CodeMirror
          value={getMatchesOutput()}
          height="200px"
          theme={oneDark}
          editable={false}
          extensions={[EditorView.lineWrapping]}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: false,
          }}
        />
      </div>
    </div>
  );
} 