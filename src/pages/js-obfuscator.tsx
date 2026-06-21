/**
 * JavaScript Obfuscator
 *
 * Obfuscates JavaScript code to protect source code from being easily read or reverse engineered.
 *
 * Features:
 * - Variable name obfuscation
 * - String encoding and encryption
 * - Control flow flattening
 * - Dead code injection
 * - Anti-debugger protection
 *
 * How to use:
 * 1. Paste your JavaScript code in the input area
 * 2. Configure obfuscation options
 * 3. Click "Obfuscate" to generate protected code
 */

import { javascript } from "@codemirror/lang-javascript";
import { Settings } from "lucide-react";
import JavaScriptObfuscator from "javascript-obfuscator";
import React, { useCallback, useState } from "react";
import { AppCodeMirror } from "../components/app-code-mirror";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { ToolCopyButton, ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolEditorGrid,
  ToolErrorBanner,
} from "../components/tool-page-layout";

export function JsObfuscatorPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isObfuscating, setIsObfuscating] = useState(false);
  const [options, setOptions] = useState({
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: "hexadecimal" as const,
    numbersToExpressions: false,
    selfDefending: false,
    shuffleStringArray: true,
    stringArray: true,
    stringArrayEncoding: [] as string[],
    stringArrayThreshold: 0.75,
    transformObjectKeys: false,
  });

  const obfuscate = useCallback(() => {
    setError("");
    if (!input.trim()) {
      setOutput("");
      return;
    }

    setIsObfuscating(true);
    setTimeout(() => {
      try {
        const obfuscationResult = JavaScriptObfuscator.obfuscate(
          input,
          options as unknown as Parameters<
            typeof JavaScriptObfuscator.obfuscate
          >[1],
        );
        setOutput(obfuscationResult.getObfuscatedCode());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Obfuscation error");
        setOutput("");
      } finally {
        setIsObfuscating(false);
      }
    }, 100);
  }, [input, options]);

  const updateOption = (
    key: keyof typeof options,
    value: boolean | string | number | string[],
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSample = () => {
    setInput(`function calculateSum(numbers) {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum;
}

const users = [
  { name: "John", age: 30 },
  { name: "Jane", age: 25 }
];

console.log(calculateSum([1, 2, 3, 4, 5]));`);
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="JavaScript Obfuscator"
        description="Obfuscate JavaScript code to protect your source"
      />

      <ToolEditorGrid>
        <ToolEditorPanel
          label="Input JavaScript"
          actions={
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Options</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Obfuscation Options</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure protection settings
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="compact" checked={options.compact} onCheckedChange={(checked) => updateOption("compact", !!checked)} />
                        <Label htmlFor="compact">Compact Output</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="stringArray" checked={options.stringArray} onCheckedChange={(checked) => updateOption("stringArray", !!checked)} />
                        <Label htmlFor="stringArray">String Array</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="shuffleStringArray" checked={options.shuffleStringArray} onCheckedChange={(checked) => updateOption("shuffleStringArray", !!checked)} />
                        <Label htmlFor="shuffleStringArray">Shuffle String Array</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="controlFlowFlattening" checked={options.controlFlowFlattening} onCheckedChange={(checked) => updateOption("controlFlowFlattening", !!checked)} />
                        <Label htmlFor="controlFlowFlattening">Control Flow Flattening</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="deadCodeInjection" checked={options.deadCodeInjection} onCheckedChange={(checked) => updateOption("deadCodeInjection", !!checked)} />
                        <Label htmlFor="deadCodeInjection">Dead Code Injection</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="selfDefending" checked={options.selfDefending} onCheckedChange={(checked) => updateOption("selfDefending", !!checked)} />
                        <Label htmlFor="selfDefending">Self Defending</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="debugProtection" checked={options.debugProtection} onCheckedChange={(checked) => updateOption("debugProtection", !!checked)} />
                        <Label htmlFor="debugProtection">Debug Protection</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="disableConsoleOutput" checked={options.disableConsoleOutput} onCheckedChange={(checked) => updateOption("disableConsoleOutput", !!checked)} />
                        <Label htmlFor="disableConsoleOutput">Disable Console</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="numbersToExpressions" checked={options.numbersToExpressions} onCheckedChange={(checked) => updateOption("numbersToExpressions", !!checked)} />
                        <Label htmlFor="numbersToExpressions">Numbers to Expressions</Label>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button onClick={obfuscate} disabled={isObfuscating}>
                {isObfuscating ? "Obfuscating..." : "Obfuscate"}
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <ToolClearButton onClear={() => { setInput(""); setOutput(""); }} />
            </>
          }
        >
          <AppCodeMirror
            value={input}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            onChange={setInput}
            placeholder="Paste your JavaScript here..."
            extensions={[javascript()]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="Obfuscated Output"
          actions={<ToolCopyButton value={output} />}
        >
          {error ? (
            <ToolErrorBanner error={error} />
          ) : (
            <AppCodeMirror
              value={output}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              extensions={[javascript()]}
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
