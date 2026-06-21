/**
 * Code Comments Remover
 *
 * Removes comments from source code in 30+ programming languages.
 *
 * Features:
 * - Support for 30+ popular programming languages (JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, PHP, Ruby, Swift, Kotlin, Scala, SQL, HTML, CSS, SCSS, Less, JSON, YAML, Markdown, Bash, PowerShell, R, Perl, Lua, Haskell, Dart, Objective-C, VB.NET, Assembly, Elixir, Clojure)
 * - Option to remove single-line comments (//, #, ;, --)
 * - Option to remove multi-line comments (/* * /, """ ''', <!-- -->)
 * - Option to preserve content inside strings (prevents removing comment-like text in strings)
 * - Live preview as you type
 * - Sample code button with examples for each language
 * - Copy to clipboard functionality
 *
 * How to use:
 * 1. Select the programming language from the dropdown
 * 2. Paste or type your code in the input editor
 * 3. Configure options (remove line comments, remove block comments, preserve strings)
 * 4. The output will be generated automatically
 * 5. Use the "Copy" button to copy the result
 * 6. Use "Sample" to load example code for testing
 * 7. Use "Clear" to reset all fields
 */

import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sass } from "@codemirror/lang-sass";
import { less } from "@codemirror/lang-less";
import { json } from "@codemirror/lang-json";
import { yaml as yamlLang } from "@codemirror/lang-yaml";
import { markdown } from "@codemirror/lang-markdown";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { php } from "@codemirror/lang-php";
import React, { useCallback, useState, useEffect } from "react";
import { useToolState } from "../hooks/useToolState";
import { AppCodeMirror } from "../components/app-code-mirror";
import { ToolCopyButton, ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorGrid,
  ToolEditorPanel,
  ToolToolbar,
  ToolErrorBanner,
} from "../components/tool-page-layout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

type Language =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "c"
  | "cpp"
  | "csharp"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "scala"
  | "sql"
  | "html"
  | "xml"
  | "css"
  | "scss"
  | "less"
  | "json"
  | "yaml"
  | "markdown"
  | "bash"
  | "powershell"
  | "r"
  | "perl"
  | "lua"
  | "haskell"
  | "dart"
  | "objc"
  | "vbnet"
  | "assembly"
  | "elixir"
  | "clojure";

interface LanguageConfig {
  name: string;
  lineComment?: string | string[];
  blockCommentStart?: string;
  blockCommentEnd?: string;
  hasDocComments?: boolean;
  docCommentStart?: string;
  docCommentEnd?: string;
}

const languageConfigs: Record<Language, LanguageConfig> = {
  javascript: {
    name: "JavaScript",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  typescript: {
    name: "TypeScript",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  python: {
    name: "Python",
    lineComment: "#",
    blockCommentStart: '"""',
    blockCommentEnd: '"""',
    hasDocComments: true,
    docCommentStart: '"""',
    docCommentEnd: '"""',
  },
  java: {
    name: "Java",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  c: {
    name: "C",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
  },
  cpp: {
    name: "C++",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  csharp: {
    name: "C#",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  go: {
    name: "Go",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
  },
  rust: {
    name: "Rust",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  php: {
    name: "PHP",
    lineComment: ["//", "#"],
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  ruby: {
    name: "Ruby",
    lineComment: "#",
    blockCommentStart: "=begin",
    blockCommentEnd: "=end",
  },
  swift: {
    name: "Swift",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  kotlin: {
    name: "Kotlin",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  scala: {
    name: "Scala",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  sql: {
    name: "SQL",
    lineComment: "--",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
  },
  html: { name: "HTML", blockCommentStart: "<!--", blockCommentEnd: "-->" },
  xml: { name: "XML", blockCommentStart: "<!--", blockCommentEnd: "-->" },
  css: {
    name: "CSS",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  scss: {
    name: "SCSS",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  less: {
    name: "Less",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
  },
  json: { name: "JSON", blockCommentStart: "/*", blockCommentEnd: "*/" },
  yaml: { name: "YAML", lineComment: "#" },
  markdown: {
    name: "Markdown",
    blockCommentStart: "<!--",
    blockCommentEnd: "-->",
  },
  bash: { name: "Bash/Shell", lineComment: "#" },
  powershell: {
    name: "PowerShell",
    lineComment: "#",
    blockCommentStart: "<#",
    blockCommentEnd: "#>",
  },
  r: { name: "R", lineComment: "#" },
  perl: {
    name: "Perl",
    lineComment: "#",
    blockCommentStart: "=cut",
    blockCommentEnd: "=cut",
  },
  lua: {
    name: "Lua",
    lineComment: "--",
    blockCommentStart: "--[[",
    blockCommentEnd: "]]",
  },
  haskell: {
    name: "Haskell",
    lineComment: "--",
    blockCommentStart: "{-",
    blockCommentEnd: "-}",
  },
  dart: {
    name: "Dart",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  objc: {
    name: "Objective-C",
    lineComment: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    hasDocComments: true,
    docCommentStart: "/**",
    docCommentEnd: "*/",
  },
  vbnet: { name: "VB.NET", lineComment: "'" },
  assembly: { name: "Assembly", lineComment: [";", "#"] },
  elixir: { name: "Elixir", lineComment: "#" },
  clojure: { name: "Clojure", lineComment: ";" },
};

interface CommentsRemoverState {
  language: Language;
  removeLineComments: boolean;
  removeBlockComments: boolean;
  preserveStrings: boolean;
  input: string;
}

const initialState: CommentsRemoverState = {
  language: "javascript",
  removeLineComments: true,
  removeBlockComments: true,
  preserveStrings: true,
  input: "",
};

function getLanguageExtension(language: Language) {
  switch (language) {
    case "javascript":
    case "typescript":
      return javascript({ typescript: language === "typescript", jsx: true });
    case "python":
      return python();
    case "html":
      return html();
    case "css":
      return css();
    case "scss":
      return sass();
    case "less":
      return less();
    case "json":
      return json();
    case "yaml":
      return yamlLang();
    case "markdown":
      return markdown();
    case "sql":
      return sql();
    case "xml":
      return xml();
    case "php":
      return php();
    default:
      return javascript();
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeComments(
  code: string,
  config: LanguageConfig,
  removeLine: boolean,
  removeBlock: boolean,
  preserveStrings: boolean,
): string {
  let result = code;

  if (preserveStrings) {
    const stringPlaceholders: string[] = [];
    let placeholderIndex = 0;

    const singleQuoteString = /'[^'\\]*(?:\\.[^'\\]*)*'/g;
    const doubleQuoteString = /"[^"\\]*(?:\\.[^"\\]*)*"/g;
    const templateString = /`[^`\\]*(?:\\.[^`\\]*)*`/g;

    result = result.replace(singleQuoteString, (match) => {
      const placeholder = `__STRING_${placeholderIndex++}__`;
      stringPlaceholders.push(match);
      return placeholder;
    });

    result = result.replace(doubleQuoteString, (match) => {
      const placeholder = `__STRING_${placeholderIndex++}__`;
      stringPlaceholders.push(match);
      return placeholder;
    });

    result = result.replace(templateString, (match) => {
      const placeholder = `__STRING_${placeholderIndex++}__`;
      stringPlaceholders.push(match);
      return placeholder;
    });

    if (removeBlock && config.blockCommentStart && config.blockCommentEnd) {
      const escapedStart = escapeRegex(config.blockCommentStart);
      const escapedEnd = escapeRegex(config.blockCommentEnd);
      const blockRegex = new RegExp(
        `${escapedStart}[\\s\\S]*?${escapedEnd}`,
        "g",
      );
      result = result.replace(blockRegex, "");
    }

    if (removeLine && config.lineComment) {
      const lineComments = Array.isArray(config.lineComment)
        ? config.lineComment.map(escapeRegex).join("|")
        : escapeRegex(config.lineComment);
      const lineRegex = new RegExp(`[ \\t]*(${lineComments}).*$`, "gm");
      result = result.replace(lineRegex, "");
    }

    result = result.replace(/__STRING_(\\d+)__/g, (_, index) => {
      return stringPlaceholders[parseInt(index)];
    });

    if (removeBlock && config.docCommentStart && config.docCommentEnd) {
      const escapedDocStart = escapeRegex(config.docCommentStart);
      const escapedDocEnd = escapeRegex(config.docCommentEnd);
      const docRegex = new RegExp(
        `${escapedDocStart}[\\s\\S]*?${escapedDocEnd}`,
        "g",
      );
      result = result.replace(docRegex, "");
    }

    result = result.replace(/^\\s*$/gm, "");
  } else {
    if (removeBlock && config.blockCommentStart && config.blockCommentEnd) {
      const escapedStart = escapeRegex(config.blockCommentStart);
      const escapedEnd = escapeRegex(config.blockCommentEnd);
      const blockRegex = new RegExp(
        `${escapedStart}[\\s\\S]*?${escapedEnd}`,
        "g",
      );
      result = result.replace(blockRegex, "");
    }

    if (removeLine && config.lineComment) {
      const lineComments = Array.isArray(config.lineComment)
        ? config.lineComment.map(escapeRegex).join("|")
        : escapeRegex(config.lineComment);
      const lineRegex = new RegExp(`[ \\t]*(${lineComments}).*$`, "gm");
      result = result.replace(lineRegex, "");
    }

    if (removeBlock && config.docCommentStart && config.docCommentEnd) {
      const escapedDocStart = escapeRegex(config.docCommentStart);
      const escapedDocEnd = escapeRegex(config.docCommentEnd);
      const docRegex = new RegExp(
        `${escapedDocStart}[\\s\\S]*?${escapedDocEnd}`,
        "g",
      );
      result = result.replace(docRegex, "");
    }
  }

  result = result.replace(/^\\s+$/gm, "");
  result = result.replace(/\\n\\n+/g, "\\n");

  return result.trim();
}

const sampleCode: Record<Language, string> = {
  javascript: `// This is a single-line comment
function greet(name) {
  /* This is a
   multi-line comment */
  return \`Hello, \${name}!\`; // inline comment
}

/**
 * Documentation comment
 * @param {string} name
 * @returns {string}
 */
function add(a, b) {
  // TODO: implement
  return a + b;
}`,
  typescript: `// TypeScript example
interface User {
  name: string; // user name
  age: number;
}

/**
 * User service class
 */
class UserService {
  // private method
  private validate(): boolean {
    /* validation logic */
    return true;
  }
}`,
  python: `# Python example
def greet(name):
    """Greet a person by name."""
    # This is a comment
    return f"Hello, {name}!"  # inline comment

class MyClass:
    '''Docstring
    multi-line'''
    def method(self):
        pass  # TODO: implement`,
  java: `// Java example
public class Main {
    /**
     * Main method
     * @param args command line args
     */
    public static void main(String[] args) {
        // Print greeting
        System.out.println("Hello"); /* block comment */
    }
}`,
  c: `// C example
#include <stdio.h>

/* Main function */
int main() {
    // Print hello
    printf("Hello\\n"); /* comment */
    return 0;
}`,
  cpp: `// C++ example
#include <iostream>

/**
 * Class documentation
 */
class MyClass {
public:
    void method(); // declaration
};`,
  csharp: `// C# example
using System;

/**
 * Program class
 */
class Program {
    // Main method
    static void Main(string[] args) {
        Console.WriteLine("Hello"); // output
    }
}`,
  go: `// Go example
package main

import "fmt"

/* Main function */
func main() {
    // Print greeting
    fmt.Println("Hello") // comment
}`,
  rust: `// Rust example
fn main() {
    // Print hello
    println!("Hello"); /* block comment */
}

/**
 * Documentation comment
 */
fn add(a: i32, b: i32) -> i32 {
    a + b // return sum
}`,
  php: `<?php
// PHP example
function greet($name) {
    // Return greeting
    return "Hello, $name"; # alternative comment
}

/* Multi-line
   comment */
echo "Hello"; // inline`,
  ruby: `# Ruby example
# This is a comment
def greet(name)
  # Return greeting
  "Hello, #{name}" # inline
end

=begin
This is a
multi-line comment
=end`,
  swift: `// Swift example
func greet(name: String) -> String {
    // Return greeting
    return "Hello, \\(name)" /* block */
}

/**
 * Documentation comment
 */
func add(a: Int, b: Int) -> Int {
    a + b
}`,
  kotlin: `// Kotlin example
fun greet(name: String): String {
    // Return greeting
    return "Hello, $name" /* block */
}

/**
 * Documentation
 */
fun add(a: Int, b: Int) = a + b`,
  scala: `// Scala example
object Main {
  def greet(name: String): String = {
    // Return greeting
    s"Hello, $name" /* block */
  }
}`,
  sql: `-- SQL example
SELECT
    id, -- user id
    name, /* user name */
    email
FROM users
WHERE active = true; -- active users`,
  html: `<!-- HTML example -->
<div>
    <!-- Comment inside HTML -->
    <p>Hello World</p> <!-- inline -->
</div>`,
  xml: `<?xml version="1.0"?>
<!-- XML comment -->
<root>
    <!-- Element -->
    <item>Value</item>
</root>`,
  css: `/* CSS example */
.container {
    /* background color */
    background: blue; /* comment */
    color: white;
}

/**
 * Documentation comment
 */
.class {
    property: value;
}`,
  scss: `// SCSS example
.container {
    // Comment
    background: blue; /* block */
    color: white;
}

/**
 * Documentation
 */
.mixin() {
    property: value;
}`,
  less: `// Less example
.container {
    // Comment
    background: blue; /* block */
    color: white;
}`,
  json: `{
    // This is not valid JSON but we handle it
    "name": "John",
    /* block comment */
    "age": 30
}`,
  yaml: `# YAML example
name: John
# Comment
age: 30
data:
    # nested comment
    value: test`,
  markdown: `# Heading

<!-- HTML comment in markdown -->
Text here

<!--
Multi-line
comment
-->
More text`,
  bash: `#!/bin/bash
# Bash example
echo "Hello" # comment

# TODO: add more`,
  powershell: `# PowerShell example
Write-Host "Hello" # comment

<#
Multi-line
comment
#>`,
  r: `# R example
# Comment
x <- 1  # assignment`,
  perl: `#!/usr/bin/perl
# Perl example
my $var = "test"; # comment

=cut
This is a
multi-line comment
=cut`,
  lua: `-- Lua example
-- single line
local x = 1 -- comment

--[[
Multi-line
comment
]]`,
  haskell: `-- Haskell example
-- Comment
add a b = a + b -- inline

{- Multi-line
   comment -}`,
  dart: `// Dart example
void main() {
  // Comment
  print('Hello'); /* block */
}

/**
 * Documentation
 */
int add(int a, int b) => a + b;`,
  objc: `// Objective-C example
@implementation MyClass

- (void)method {
    // Comment
    NSLog(@"Hello"); /* block */
}

/** Documentation */
- (void)docMethod {
}

@end`,
  vbnet: `' VB.NET example
' Comment
Sub Main()
    Console.WriteLine("Hello") ' inline
End Sub`,
  assembly: `; Assembly example
; comment
MOV AX, 1 ; move value
# alt comment`,
  elixir: `# Elixir example
# Comment
def greet(name) do
  "Hello, #{name}" # inline
end`,
  clojure: `; Clojure example
; comment
(def x 1) ; inline

;#_ (comment skip)
`,
};

export function CodeCommentsRemoverPage() {
  const [state, setState, clearState] = useToolState(
    "code-comments-remover",
    initialState,
  );
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const language = state?.language ?? initialState.language;
  const removeLineComments =
    state?.removeLineComments ?? initialState.removeLineComments;
  const removeBlockComments =
    state?.removeBlockComments ?? initialState.removeBlockComments;
  const preserveStrings =
    state?.preserveStrings ?? initialState.preserveStrings;
  const input = state?.input ?? initialState.input;

  const config = languageConfigs[language];

  const removeCommentsCallback = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput("");
        setError("");
        return;
      }

      const result = removeComments(
        input,
        config,
        removeLineComments,
        removeBlockComments,
        preserveStrings,
      );

      setOutput(result);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove comments",
      );
      setOutput("");
    }
  }, [input, config, removeLineComments, removeBlockComments, preserveStrings]);

  useEffect(() => {
    removeCommentsCallback();
  }, [removeCommentsCallback]);

  const handleLanguageChange = (value: string) => {
    setState((prev) => ({ ...prev, language: value as Language }));
  };

  const handleOptionChange = (
    key: "removeLineComments" | "removeBlockComments" | "preserveStrings",
    value: boolean,
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleInputChange = (value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  };

  const handleSample = () => {
    const sample = sampleCode[language] || "// Sample code";
    setState((prev) => ({ ...prev, input: sample }));
  };

  const handleClear = async () => {
    await clearState();
    setOutput("");
    setError("");
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setState((prev) => ({ ...prev, input: text }));
    } catch (err) {
      setError("Failed to read from clipboard");
    }
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Code Comments Remover"
        description="Remove comments from source code in 30+ programming languages"
      />

      <Card className="p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(languageConfigs).map(([key, lang]) => (
                  <SelectItem key={key} value={key}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="remove-line"
              checked={removeLineComments}
              onCheckedChange={(checked) =>
                handleOptionChange("removeLineComments", checked)
              }
            />
            <Label htmlFor="remove-line" className="cursor-pointer">
              Remove Line Comments
            </Label>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="remove-block"
              checked={removeBlockComments}
              onCheckedChange={(checked) =>
                handleOptionChange("removeBlockComments", checked)
              }
            />
            <Label htmlFor="remove-block" className="cursor-pointer">
              Remove Block Comments
            </Label>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="preserve-strings"
              checked={preserveStrings}
              onCheckedChange={(checked) =>
                handleOptionChange("preserveStrings", checked)
              }
            />
            <Label htmlFor="preserve-strings" className="cursor-pointer">
              Preserve Strings
            </Label>
          </div>
        </div>
      </Card>

      <ToolEditorGrid>
        <ToolEditorPanel
          label="Input Code"
          actions={
            <ToolToolbar>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClipboardPaste}
              >
                Paste
              </Button>
              <Button variant="outline" size="sm" onClick={handleSample}>
                Sample
              </Button>
            </ToolToolbar>
          }
          heightClass="h-[calc(100vh-20rem)]"
        >
          <AppCodeMirror
            value={input}
            onChange={handleInputChange}
            height="100%"
            extensions={[
              getLanguageExtension(language),
              EditorView.lineWrapping,
            ]}
            className="border rounded-md h-full"
          />
        </ToolEditorPanel>

        <ToolEditorPanel
          label="Output Code"
          actions={
            <ToolToolbar>
              <ToolClearButton onClear={handleClear} />
              <ToolCopyButton value={output} />
            </ToolToolbar>
          }
          heightClass="h-[calc(100vh-20rem)]"
        >
          <AppCodeMirror
            value={output}
            height="100%"
            extensions={[
              getLanguageExtension(language),
              EditorView.lineWrapping,
            ]}
            editable={false}
            className="border rounded-md h-full"
          />
        </ToolEditorPanel>
      </ToolEditorGrid>

      <ToolErrorBanner error={error} />
    </ToolPageContainer>
  );
}
