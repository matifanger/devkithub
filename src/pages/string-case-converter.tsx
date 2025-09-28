import { EditorView } from '@codemirror/view';
import { Settings } from 'lucide-react';
import React, { useCallback, useState } from 'react';
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

type CaseType =
  | 'camelCase'
  | 'PascalCase'
  | 'snake_case'
  | 'SCREAMING_SNAKE_CASE'
  | 'kebab-case'
  | 'SCREAMING-KEBAB-CASE'
  | 'dot.case'
  | 'path/case'
  | 'UPPERCASE'
  | 'lowercase'
  | 'Title Case'
  | 'Sentence case'
  | 'alternatingCase';

interface ConverterConfig {
  outputCase: CaseType;
  preserveNumbers: boolean;
  removeSpecialChars: boolean;
  preserveSpecificChars: string;
  treatHyphensAsWords: boolean;
  treatUnderscoresAsWords: boolean;
  treatDotsAsWords: boolean;
  treatSpacesAsWords: boolean;
}

export function StringCaseConverterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [config, setConfig] = useState<ConverterConfig>({
    outputCase: 'camelCase',
    preserveNumbers: true,
    removeSpecialChars: true,
    preserveSpecificChars: '',
    treatHyphensAsWords: true,
    treatUnderscoresAsWords: true,
    treatDotsAsWords: true,
    treatSpacesAsWords: true,
  });

  const convertCase = useCallback(
    (text: string, newConfig = config) => {
      try {
        if (!text.trim()) {
          setOutput('');
          setError('');
          return;
        }

        // Process each line individually
        const lines = text.split('\n');
        const processedLines = lines.map((line) => {
          if (!line.trim()) return '';

          // Split the text into words based on configuration
          let words = line;

          // Replace special characters except those to preserve
          if (newConfig.removeSpecialChars) {
            const preserveRegex = new RegExp(
              `[^${newConfig.preserveNumbers ? 'a-zA-Z0-9' : 'a-zA-Z'}${newConfig.preserveSpecificChars}\\s_.-]`,
              'g'
            );
            words = words.replace(preserveRegex, ' ');
          }

          // Split into words based on configuration
          const separators = [
            newConfig.treatSpacesAsWords ? ' ' : '',
            newConfig.treatHyphensAsWords ? '-' : '',
            newConfig.treatUnderscoresAsWords ? '_' : '',
            newConfig.treatDotsAsWords ? '\\.' : '',
          ]
            .filter(Boolean)
            .join('|');

          // Split words and handle numbers
          const wordArray = words
            .split(new RegExp(`[${separators}]+`))
            .filter((word) => word.length > 0)
            .flatMap((word) => {
              // If preserveNumbers is true and word contains only numbers, don't convert case
              if (newConfig.preserveNumbers && /^\d+$/.test(word)) {
                return [word];
              }
              // Split by capital letters to handle existing camelCase/PascalCase
              if (/[A-Z]/.test(word)) {
                return (
                  word
                    // Add space before capitals, but not at the start of the word
                    .replace(/([A-Z])/g, ' $1')
                    .trim()
                    .split(' ')
                    .filter((w) => w.length > 0)
                );
              }
              return [word.toLowerCase()];
            });

          // Convert to desired case
          let result = '';
          switch (newConfig.outputCase) {
            case 'camelCase':
              result = wordArray
                .map((word, i) => {
                  if (newConfig.preserveNumbers && /^\d+$/.test(word)) return word;
                  return i === 0
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join('');
              break;

            case 'PascalCase':
              result = wordArray
                .map((word) => {
                  if (newConfig.preserveNumbers && /^\d+$/.test(word)) return word;
                  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join('');
              break;

            case 'snake_case':
              result = wordArray.map((word) => word.toLowerCase()).join('_');
              break;

            case 'SCREAMING_SNAKE_CASE':
              result = wordArray
                .map((word) =>
                  newConfig.preserveNumbers && /^\d+$/.test(word) ? word : word.toUpperCase()
                )
                .join('_');
              break;

            case 'kebab-case':
              result = wordArray.map((word) => word.toLowerCase()).join('-');
              break;

            case 'SCREAMING-KEBAB-CASE':
              result = wordArray
                .map((word) =>
                  newConfig.preserveNumbers && /^\d+$/.test(word) ? word : word.toUpperCase()
                )
                .join('-');
              break;

            case 'dot.case':
              result = wordArray.map((word) => word.toLowerCase()).join('.');
              break;

            case 'path/case':
              result = wordArray.map((word) => word.toLowerCase()).join('/');
              break;

            case 'UPPERCASE':
              result = wordArray
                .map((word) =>
                  newConfig.preserveNumbers && /^\d+$/.test(word) ? word : word.toUpperCase()
                )
                .join(' ');
              break;

            case 'lowercase':
              result = wordArray
                .map((word) =>
                  newConfig.preserveNumbers && /^\d+$/.test(word) ? word : word.toLowerCase()
                )
                .join(' ');
              break;

            case 'Title Case':
              result = wordArray
                .map((word) => {
                  if (newConfig.preserveNumbers && /^\d+$/.test(word)) return word;
                  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                })
                .join(' ');
              break;

            case 'Sentence case': {
              const sentence = wordArray
                .map((word) =>
                  newConfig.preserveNumbers && /^\d+$/.test(word) ? word : word.toLowerCase()
                )
                .join(' ');
              result = sentence.charAt(0).toUpperCase() + sentence.slice(1);
              break;
            }

            case 'alternatingCase':
              result = line
                .split('')
                .map((char, i) => {
                  if (newConfig.preserveNumbers && /^\d+$/.test(char)) return char;
                  return i % 2 === 0 ? char.toUpperCase() : char.toLowerCase();
                })
                .join('');
              break;

            default:
              result = line;
          }

          return result;
        });

        setOutput(processedLines.join('\n'));
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid input');
        setOutput('');
      }
    },
    [config]
  );

  const handleSample = () => {
    const sample = `This is a Sample Text with-different_separators.and.some/special/characters!
user_profile_data
API_ENDPOINT_URL
my.email.address@domain.com
path/to/some/file/location
first-name-last-name
ThisIsACamelCaseExample
this_is_a_snake_case_example
THIS_IS_A_SCREAMING_SNAKE_CASE
this-is-a-kebab-case-example
THIS-IS-A-SCREAMING-KEBAB-CASE
this.is.a.dot.case.example
this is a sentence case example
This Is A Title Case Example
this_is_an_example_with numbers123
special@#$characters%^&*example
multi word.with-different_separators.in.one-line
camelCaseExample
PascalCaseExample
snake_case_example
SCREAMING_SNAKE_CASE_EXAMPLE
kebab-case-example
SCREAMING-KEBAB-CASE-EXAMPLE
dot.case.example
path/to/example
UPPERCASE EXAMPLE
lowercase example
Title Case Example
Sentence case example
aLtErNaTiNg CaSe ExAmPlE`;
    setInput(sample);
    convertCase(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      convertCase(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const updateConfig = <K extends keyof ConverterConfig>(key: K, value: ConverterConfig[K]) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (input) convertCase(input, newConfig);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">String Case Converter</h1>
        <p className="text-muted-foreground">
          Convert text between different case styles with customizable options
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Label>Input Text</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Conversion Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure case conversion options
                      </p>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Output Case</Label>
                        <div className="col-span-2">
                          <Select
                            value={config.outputCase}
                            onValueChange={(value: CaseType) => updateConfig('outputCase', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Output Case" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="camelCase">camelCase</SelectItem>
                              <SelectItem value="PascalCase">PascalCase</SelectItem>
                              <SelectItem value="snake_case">snake_case</SelectItem>
                              <SelectItem value="SCREAMING_SNAKE_CASE">
                                SCREAMING_SNAKE_CASE
                              </SelectItem>
                              <SelectItem value="kebab-case">kebab-case</SelectItem>
                              <SelectItem value="SCREAMING-KEBAB-CASE">
                                SCREAMING-KEBAB-CASE
                              </SelectItem>
                              <SelectItem value="dot.case">dot.case</SelectItem>
                              <SelectItem value="path/case">path/case</SelectItem>
                              <SelectItem value="UPPERCASE">UPPERCASE</SelectItem>
                              <SelectItem value="lowercase">lowercase</SelectItem>
                              <SelectItem value="Title Case">Title Case</SelectItem>
                              <SelectItem value="Sentence case">Sentence case</SelectItem>
                              <SelectItem value="alternatingCase">aLtErNaTiNg CaSe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Preserve Numbers</Label>
                        <Switch
                          checked={config.preserveNumbers}
                          onCheckedChange={(checked) => updateConfig('preserveNumbers', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Remove Special Characters</Label>
                        <Switch
                          checked={config.removeSpecialChars}
                          onCheckedChange={(checked) => updateConfig('removeSpecialChars', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Treat Hyphens as Word Separators</Label>
                        <Switch
                          checked={config.treatHyphensAsWords}
                          onCheckedChange={(checked) =>
                            updateConfig('treatHyphensAsWords', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Treat Underscores as Word Separators</Label>
                        <Switch
                          checked={config.treatUnderscoresAsWords}
                          onCheckedChange={(checked) =>
                            updateConfig('treatUnderscoresAsWords', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Treat Dots as Word Separators</Label>
                        <Switch
                          checked={config.treatDotsAsWords}
                          onCheckedChange={(checked) => updateConfig('treatDotsAsWords', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Treat Spaces as Word Separators</Label>
                        <Switch
                          checked={config.treatSpacesAsWords}
                          onCheckedChange={(checked) => updateConfig('treatSpacesAsWords', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInput('');
                  setOutput('');
                  setError('');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <AppCodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              extensions={[EditorView.lineWrapping]}
              onChange={(value) => {
                setInput(value);
                convertCase(value);
              }}
              placeholder="Enter text to convert"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Converted Text</Label>
            <Button variant="outline" onClick={() => copyToClipboard(output)}>
              Copy
            </Button>
          </div>

          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
          ) : (
            <div className="h-[calc(100vh-17rem)]">
              <AppCodeMirror
                value={output}
                height="100%"
                className="h-[calc(100vh-17rem)]"
                extensions={[EditorView.lineWrapping]}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
