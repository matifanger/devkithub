import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { RefreshCw } from 'lucide-react';
import { EditorView } from '@codemirror/view';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";

type Preset = 
  | 'password'
  | 'uuid'
  | 'api-key'
  | 'encryption-key'
  | 'username'
  | 'url-safe'
  | 'hex-color'
  | 'custom';

interface GeneratorConfig {
  preset: Preset;
  length: number;
  seed: string;
  uppercaseCount: number;
  lowercaseCount: number;
  digitCount: number;
  symbolCount: number;
  customSymbols: string;
  excludeSimilarCharacters: boolean;
  excludeAmbiguous: boolean;
  wordCount: number;
  wordSeparator: string;
  groupSize: number;
  groupSeparator: string;
  customCharacterSet: string;
  allowDuplicates: boolean;
  startWithLetter: boolean;
  avoidProfanity: boolean;
  useWords: boolean;
  minWordLength: number;
  maxWordLength: number;
  usePronounceable: boolean;
  customPattern: string;
  multipleResults: number;
  uniqueResults: boolean;
}

const PRESETS = {
  password: {
    length: 16,
    uppercaseCount: 2,
    lowercaseCount: 8,
    digitCount: 4,
    symbolCount: 2,
    excludeSimilarCharacters: true,
    excludeAmbiguous: true,
    groupSize: 4,
    groupSeparator: '-',
    allowDuplicates: true,
    startWithLetter: false,
  },
  uuid: {
    length: 32,
    uppercaseCount: 0,
    lowercaseCount: 32,
    digitCount: 0,
    symbolCount: 0,
    groupSize: 8,
    groupSeparator: '-',
    customPattern: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
  },
  'api-key': {
    length: 32,
    uppercaseCount: 16,
    lowercaseCount: 8,
    digitCount: 8,
    symbolCount: 0,
    groupSize: 8,
    groupSeparator: '.',
    startWithLetter: true,
  },
  'encryption-key': {
    length: 64,
    uppercaseCount: 16,
    lowercaseCount: 16,
    digitCount: 16,
    symbolCount: 16,
    groupSize: 8,
    groupSeparator: '',
  },
  username: {
    length: 12,
    uppercaseCount: 0,
    lowercaseCount: 10,
    digitCount: 2,
    symbolCount: 0,
    startWithLetter: true,
    avoidProfanity: true,
  },
  'url-safe': {
    length: 16,
    uppercaseCount: 4,
    lowercaseCount: 8,
    digitCount: 4,
    symbolCount: 0,
    customSymbols: '-_',
    startWithLetter: true,
  },
  'hex-color': {
    length: 6,
    customCharacterSet: '0123456789ABCDEF',
    groupSize: 0,
    allowDuplicates: true,
  },
};

const DEFAULT_CONFIG: GeneratorConfig = {
  preset: 'password',
  length: 16,
  seed: '',
  uppercaseCount: 2,
  lowercaseCount: 8,
  digitCount: 4,
  symbolCount: 2,
  customSymbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  excludeSimilarCharacters: true,
  excludeAmbiguous: true,
  wordCount: 4,
  wordSeparator: '-',
  groupSize: 4,
  groupSeparator: '-',
  customCharacterSet: '',
  allowDuplicates: true,
  startWithLetter: false,
  avoidProfanity: true,
  useWords: false,
  minWordLength: 3,
  maxWordLength: 8,
  usePronounceable: false,
  customPattern: '',
  multipleResults: 1,
  uniqueResults: true,
};

const SIMILAR_CHARS = ['1', 'l', 'I', '0', 'O', 'o'];
const AMBIGUOUS_CHARS = ['`', '"', '\'', '(', ')', ',', '.', ';', ':'];

export function RandomStringGeneratorPage() {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [config, setConfig] = useState<GeneratorConfig>(DEFAULT_CONFIG);

  const generateString = useCallback(() => {
    try {
      let charset = '';
      const requiredChars: string[] = [];
      
      // Build character set based on configuration
      if (config.customCharacterSet) {
        charset = config.customCharacterSet;
      } else {
        if (config.uppercaseCount > 0) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (config.lowercaseCount > 0) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (config.digitCount > 0) charset += '0123456789';
        if (config.symbolCount > 0) charset += config.customSymbols;

        // Remove similar characters if configured
        if (config.excludeSimilarCharacters) {
          SIMILAR_CHARS.forEach(char => {
            charset = charset.replace(new RegExp(char, 'g'), '');
          });
        }

        // Remove ambiguous characters if configured
        if (config.excludeAmbiguous) {
          AMBIGUOUS_CHARS.forEach(char => {
            charset = charset.replace(new RegExp('\\' + char, 'g'), '');
          });
        }
      }

      // Generate required characters first
      if (!config.customCharacterSet) {
        if (config.uppercaseCount > 0) {
          for (let i = 0; i < config.uppercaseCount; i++) {
            requiredChars.push(getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
          }
        }
        if (config.lowercaseCount > 0) {
          for (let i = 0; i < config.lowercaseCount; i++) {
            requiredChars.push(getRandomChar('abcdefghijklmnopqrstuvwxyz'));
          }
        }
        if (config.digitCount > 0) {
          for (let i = 0; i < config.digitCount; i++) {
            requiredChars.push(getRandomChar('0123456789'));
          }
        }
        if (config.symbolCount > 0) {
          for (let i = 0; i < config.symbolCount; i++) {
            requiredChars.push(getRandomChar(config.customSymbols));
          }
        }
      }

      let results = [];
      for (let r = 0; r < config.multipleResults; r++) {
        let result = '';
        
        if (config.useWords) {
          // Generate word-based string
          const words = [];
          for (let i = 0; i < config.wordCount; i++) {
            const wordLength = Math.floor(Math.random() * 
              (config.maxWordLength - config.minWordLength + 1)) + config.minWordLength;
            let word = '';
            for (let j = 0; j < wordLength; j++) {
              word += getRandomChar(charset);
            }
            words.push(word);
          }
          result = words.join(config.wordSeparator);
        } else if (config.customPattern) {
          // Use custom pattern (like UUID)
          result = config.customPattern.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        } else {
          // Mix required characters with random ones
          const chars = [...requiredChars];
          while (chars.length < config.length) {
            chars.push(getRandomChar(charset));
          }

          // Shuffle the array
          for (let i = chars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
          }

          // Ensure starts with letter if configured
          if (config.startWithLetter && chars[0].match(/[^a-zA-Z]/)) {
            const letterChar = getRandomChar('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
            const nonLetterIndex = chars.findIndex(c => c.match(/[a-zA-Z]/));
            if (nonLetterIndex !== -1) {
              [chars[0], chars[nonLetterIndex]] = [letterChar, chars[0]];
            } else {
              chars[0] = letterChar;
            }
          }

          result = chars.join('');
        }

        // Apply grouping if configured
        if (config.groupSize > 0) {
          const groups = result.match(new RegExp(`.{1,${config.groupSize}}`, 'g')) || [];
          result = groups.join(config.groupSeparator);
        }

        results.push(result);
      }

      // Ensure unique results if configured
      if (config.uniqueResults) {
        results = [...new Set(results)];
        while (results.length < config.multipleResults) {
          const newResult = generateString();
          if (!results.includes(newResult)) {
            results.push(newResult);
          }
        }
      }

      setOutput(results.join('\n'));
      setError('');
      return results.join('\n');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate string');
      setOutput('');
      return '';
    }
  }, [config]);

  // Auto-generate on config changes
  useEffect(() => {
    generateString();
  }, [config, generateString]);

  const getRandomChar = (charset: string) => {
    return charset.charAt(Math.floor(Math.random() * charset.length));
  };

  const handlePresetChange = (preset: Preset) => {
    if (preset === 'custom') {
      return;
    }
    
    const presetConfig = PRESETS[preset];
    setConfig({
      ...DEFAULT_CONFIG,
      ...presetConfig,
      preset,
    });
  };

  const updateConfig = <K extends keyof GeneratorConfig>(key: K, value: GeneratorConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Random String Generator</h1>
        <p className="text-muted-foreground">Generate random strings with customizable options and presets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-4 overflow-y-auto h-[calc(100vh-12rem)]">
          <div className="flex items-center justify-between">
            <Label>Configuration</Label>
            <Button variant="outline" onClick={generateString}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Preset</Label>
              <div className="col-span-2">
                <Select value={config.preset} onValueChange={(value: Preset) => handlePresetChange(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">Password</SelectItem>
                    <SelectItem value="uuid">UUID</SelectItem>
                    <SelectItem value="api-key">API Key</SelectItem>
                    <SelectItem value="encryption-key">Encryption Key</SelectItem>
                    <SelectItem value="username">Username</SelectItem>
                    <SelectItem value="url-safe">URL Safe</SelectItem>
                    <SelectItem value="hex-color">Hex Color</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Length</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.length]}
                  min={1}
                  max={128}
                  step={1}
                  onValueChange={([value]) => updateConfig('length', value)}
                />
                <span className="text-sm text-muted-foreground">{config.length} characters</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Uppercase Letters</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.uppercaseCount]}
                  min={0}
                  max={config.length}
                  step={1}
                  onValueChange={([value]) => updateConfig('uppercaseCount', value)}
                />
                <span className="text-sm text-muted-foreground">{config.uppercaseCount} characters</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Lowercase Letters</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.lowercaseCount]}
                  min={0}
                  max={config.length}
                  step={1}
                  onValueChange={([value]) => updateConfig('lowercaseCount', value)}
                />
                <span className="text-sm text-muted-foreground">{config.lowercaseCount} characters</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Numbers</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.digitCount]}
                  min={0}
                  max={config.length}
                  step={1}
                  onValueChange={([value]) => updateConfig('digitCount', value)}
                />
                <span className="text-sm text-muted-foreground">{config.digitCount} characters</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Symbols</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.symbolCount]}
                  min={0}
                  max={config.length}
                  step={1}
                  onValueChange={([value]) => updateConfig('symbolCount', value)}
                />
                <span className="text-sm text-muted-foreground">{config.symbolCount} characters</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Custom Symbols</Label>
              <Input
                className="col-span-2"
                value={config.customSymbols}
                onChange={(e) => updateConfig('customSymbols', e.target.value)}
                placeholder="!@#$%^&*()_+-=[]{}|;:,.<>?"
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Group Size</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.groupSize]}
                  min={0}
                  max={16}
                  step={1}
                  onValueChange={([value]) => updateConfig('groupSize', value)}
                />
                <span className="text-sm text-muted-foreground">
                  {config.groupSize === 0 ? 'No grouping' : `${config.groupSize} characters per group`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Group Separator</Label>
              <Input
                className="col-span-2"
                value={config.groupSeparator}
                onChange={(e) => updateConfig('groupSeparator', e.target.value)}
                placeholder="-"
                maxLength={1}
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Custom Character Set</Label>
              <Input
                className="col-span-2"
                value={config.customCharacterSet}
                onChange={(e) => updateConfig('customCharacterSet', e.target.value)}
                placeholder="Custom characters to use"
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Multiple Results</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.multipleResults]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={([value]) => updateConfig('multipleResults', value)}
                />
                <span className="text-sm text-muted-foreground">{config.multipleResults} results</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Exclude Similar Characters (1/l, 0/O)</Label>
              <Switch
                checked={config.excludeSimilarCharacters}
                onCheckedChange={(checked) => updateConfig('excludeSimilarCharacters', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Exclude Ambiguous Characters</Label>
              <Switch
                checked={config.excludeAmbiguous}
                onCheckedChange={(checked) => updateConfig('excludeAmbiguous', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Allow Duplicates</Label>
              <Switch
                checked={config.allowDuplicates}
                onCheckedChange={(checked) => updateConfig('allowDuplicates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Start With Letter</Label>
              <Switch
                checked={config.startWithLetter}
                onCheckedChange={(checked) => updateConfig('startWithLetter', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Unique Results</Label>
              <Switch
                checked={config.uniqueResults}
                onCheckedChange={(checked) => updateConfig('uniqueResults', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Use Words</Label>
              <Switch
                checked={config.useWords}
                onCheckedChange={(checked) => updateConfig('useWords', checked)}
              />
            </div>

            {config.useWords && (
              <>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label>Word Count</Label>
                  <div className="col-span-2">
                    <Slider
                      value={[config.wordCount]}
                      min={1}
                      max={20}
                      step={1}
                      onValueChange={([value]) => updateConfig('wordCount', value)}
                    />
                    <span className="text-sm text-muted-foreground">{config.wordCount} words</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label>Word Separator</Label>
                  <Input
                    className="col-span-2"
                    value={config.wordSeparator}
                    onChange={(e) => updateConfig('wordSeparator', e.target.value)}
                    placeholder="-"
                  />
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label>Min Word Length</Label>
                  <div className="col-span-2">
                    <Slider
                      value={[config.minWordLength]}
                      min={1}
                      max={config.maxWordLength}
                      step={1}
                      onValueChange={([value]) => updateConfig('minWordLength', value)}
                    />
                    <span className="text-sm text-muted-foreground">{config.minWordLength} characters</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <Label>Max Word Length</Label>
                  <div className="col-span-2">
                    <Slider
                      value={[config.maxWordLength]}
                      min={config.minWordLength}
                      max={20}
                      step={1}
                      onValueChange={([value]) => updateConfig('maxWordLength', value)}
                    />
                    <span className="text-sm text-muted-foreground">{config.maxWordLength} characters</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Output</Label>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(output)}>
              Copy
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          <div className="h-[calc(100vh-17rem)]">
            <CodeMirror
              value={output}
              className='h-[calc(100vh-17rem)]'
              height="100%"
              theme={oneDark}
              extensions={[EditorView.lineWrapping]}
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