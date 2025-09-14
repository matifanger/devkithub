import { EditorView } from '@codemirror/view';
import { RefreshCw } from 'lucide-react';
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
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';

interface GeneratorConfig {
  type: 'paragraphs' | 'sentences' | 'words';
  count: number;
  minWordsPerSentence: number;
  maxWordsPerSentence: number;
  minSentencesPerParagraph: number;
  maxSentencesPerParagraph: number;
  format: 'plain' | 'html';
  startWithLorem: boolean;
  capitalize: boolean;
  addPeriod: boolean;
}

const DEFAULT_CONFIG: GeneratorConfig = {
  type: 'paragraphs',
  count: 3,
  minWordsPerSentence: 5,
  maxWordsPerSentence: 15,
  minSentencesPerParagraph: 3,
  maxSentencesPerParagraph: 7,
  format: 'plain',
  startWithLorem: true,
  capitalize: true,
  addPeriod: true,
};

const LOREM_WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'eu',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
];

export function LoremIpsumGeneratorPage() {
  const [output, setOutput] = useState('');
  const [config, setConfig] = useState<GeneratorConfig>(DEFAULT_CONFIG);

  const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateWord = (index: number) => {
    if (index === 0 && config.startWithLorem) return 'Lorem';
    return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
  };

  const generateSentence = (isFirst: boolean) => {
    const wordCount = getRandomInt(config.minWordsPerSentence, config.maxWordsPerSentence);
    const words = Array.from({ length: wordCount }, (_, i) => {
      const word = generateWord(isFirst ? i : i + 1000);
      return i === 0 && config.capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    });
    return words.join(' ') + (config.addPeriod ? '.' : '');
  };

  const generateParagraph = (isFirst: boolean) => {
    const sentenceCount = getRandomInt(
      config.minSentencesPerParagraph,
      config.maxSentencesPerParagraph
    );
    const sentences = Array.from({ length: sentenceCount }, (_, i) =>
      generateSentence(isFirst && i === 0)
    );
    return sentences.join(' ');
  };

  const generateLoremIpsum = useCallback(() => {
    let result = '';

    switch (config.type) {
      case 'paragraphs':
        result = Array.from({ length: config.count }, (_, i) => generateParagraph(i === 0))
          .map((p) => (config.format === 'html' ? `<p>${p}</p>` : p))
          .join(config.format === 'html' ? '\n' : '\n\n');
        break;
      case 'sentences':
        result = Array.from({ length: config.count }, (_, i) => generateSentence(i === 0)).join(
          ' '
        );
        break;
      case 'words':
        result = Array.from({ length: config.count }, (_, i) => generateWord(i)).join(' ');
        if (config.addPeriod) result += '.';
        break;
    }

    setOutput(result);
  }, [config]);

  useEffect(() => {
    generateLoremIpsum();
  }, [config, generateLoremIpsum]);

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  const updateConfig = <K extends keyof GeneratorConfig>(key: K, value: GeneratorConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Lorem Ipsum Generator</h1>
        <p className="text-muted-foreground">
          Generate customizable Lorem Ipsum text for your design and development needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 overflow-y-auto h-[calc(100vh-12rem)]">
          <div className="flex items-center justify-between">
            <Label>Configuration</Label>
            <Button variant="outline" onClick={generateLoremIpsum}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Type</Label>
              <div className="col-span-2">
                <Select
                  value={config.type}
                  onValueChange={(value: GeneratorConfig['type']) => updateConfig('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paragraphs">Paragraphs</SelectItem>
                    <SelectItem value="sentences">Sentences</SelectItem>
                    <SelectItem value="words">Words</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Count</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.count]}
                  min={1}
                  max={config.type === 'words' ? 100 : 20}
                  step={1}
                  onValueChange={([value]) => updateConfig('count', value)}
                />
                <span className="text-sm text-muted-foreground">
                  {config.count} {config.type}
                </span>
              </div>
            </div>

            {config.type !== 'words' && (
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>Words per Sentence</Label>
                <div className="col-span-2 space-y-4">
                  <div>
                    <Label className="text-sm">Minimum</Label>
                    <Slider
                      value={[config.minWordsPerSentence]}
                      min={3}
                      max={20}
                      step={1}
                      onValueChange={([value]) => updateConfig('minWordsPerSentence', value)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {config.minWordsPerSentence} words
                    </span>
                  </div>
                  <div>
                    <Label className="text-sm">Maximum</Label>
                    <Slider
                      value={[config.maxWordsPerSentence]}
                      min={config.minWordsPerSentence}
                      max={30}
                      step={1}
                      onValueChange={([value]) => updateConfig('maxWordsPerSentence', value)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {config.maxWordsPerSentence} words
                    </span>
                  </div>
                </div>
              </div>
            )}

            {config.type === 'paragraphs' && (
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>Sentences per Paragraph</Label>
                <div className="col-span-2 space-y-4">
                  <div>
                    <Label className="text-sm">Minimum</Label>
                    <Slider
                      value={[config.minSentencesPerParagraph]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={([value]) => updateConfig('minSentencesPerParagraph', value)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {config.minSentencesPerParagraph} sentences
                    </span>
                  </div>
                  <div>
                    <Label className="text-sm">Maximum</Label>
                    <Slider
                      value={[config.maxSentencesPerParagraph]}
                      min={config.minSentencesPerParagraph}
                      max={15}
                      step={1}
                      onValueChange={([value]) => updateConfig('maxSentencesPerParagraph', value)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {config.maxSentencesPerParagraph} sentences
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Format</Label>
              <div className="col-span-2">
                <Select
                  value={config.format}
                  onValueChange={(value: GeneratorConfig['format']) =>
                    updateConfig('format', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plain">Plain Text</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Start with "Lorem"</Label>
              <Switch
                checked={config.startWithLorem}
                onCheckedChange={(checked) => updateConfig('startWithLorem', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Capitalize First Letter</Label>
              <Switch
                checked={config.capitalize}
                onCheckedChange={(checked) => updateConfig('capitalize', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Add Period at End</Label>
              <Switch
                checked={config.addPeriod}
                onCheckedChange={(checked) => updateConfig('addPeriod', checked)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Output</Label>
            <Button variant="outline" onClick={copyOutput}>
              Copy
            </Button>
          </div>

          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
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
