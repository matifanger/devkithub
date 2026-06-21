/**
 * Character/Word Counter
 *
 * Counts characters, words, lines, sentences, paragraphs and other text statistics.
 *
 * Features:
 * - Character count (with and without spaces)
 * - Word count with multiple language support
 * - Line count
 * - Sentence count
 * - Paragraph count
 * - Reading time estimation
 * - Speaking time estimation
 * - Most common words analysis
 * - Character frequency analysis
 *
 * How to use:
 * 1. Paste or type your text in the input area
 * 2. View real-time statistics in the results panel
 * 3. Toggle between different counting modes
 * 4. Use the copy button to copy specific statistics
 */

import React, { useMemo } from "react";
import { AppCodeMirror } from "../components/app-code-mirror";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolEditorGrid,
  ToolToolbar,
} from "../components/tool-page-layout";
import { useToolState } from "../hooks/useToolState";

interface CharacterWordCounterState {
  text: string;
  countMode: string;
  includeSpaces: boolean;
  caseSensitive: boolean;
}

const initialState: CharacterWordCounterState = {
  text: "",
  countMode: "all",
  includeSpaces: true,
  caseSensitive: false,
};

export function CharacterWordCounterPage() {
  const [state, setState, clearState] = useToolState(
    "character-word-counter",
    initialState,
  );

  const stats = useMemo(() => {
    const text = state.text;
    if (!text.trim()) {
      return {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        lines: 0,
        sentences: 0,
        paragraphs: 0,
        paragraphsByNewline: 0,
        readingTime: 0,
        speakingTime: 0,
        averageWordLength: 0,
        averageSentenceLength: 0,
        longestWord: "",
        shortestWord: "",
        mostCommonWords: [] as Array<{ word: string; count: number }>,
        characterFrequency: [] as Array<{ char: string; count: number }>,
      };
    }

    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;

    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const wordCount = words.length;

    const lines = text.split("\n").filter((l) => l.length > 0).length;
    const lineCount = text.split("\n").length;

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;

    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const paragraphCount = paragraphs.length;
    const paragraphCountByNewline = text
      .split("\n")
      .filter((p) => p.trim().length > 0).length;

    const readingTime = Math.ceil(wordCount / 200);
    const speakingTime = Math.ceil(wordCount / 150);

    const wordLengths = words.map((w) => w.length);
    const averageWordLength =
      wordLengths.length > 0
        ? wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length
        : 0;

    const averageSentenceLength =
      sentenceCount > 0 ? wordCount / sentenceCount : 0;

    const sortedByLength = [...words].sort((a, b) => b.length - a.length);
    const longestWord = sortedByLength[0] || "";
    const shortestWord = sortedByLength[sortedByLength.length - 1] || "";

    const wordFrequency: Record<string, number> = {};
    const caseSensitive = state.caseSensitive;
    words.forEach((word) => {
      const key = caseSensitive ? word : word.toLowerCase();
      wordFrequency[key] = (wordFrequency[key] || 0) + 1;
    });

    const mostCommonWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    const charFrequency: Record<string, number> = {};
    text.split("").forEach((char) => {
      charFrequency[char] = (charFrequency[char] || 0) + 1;
    });

    const characterFrequency = Object.entries(charFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([char, count]) => ({ char, count }));

    return {
      characters: charsWithSpaces,
      charactersNoSpaces: charsNoSpaces,
      words: wordCount,
      lines: lineCount,
      sentences: sentenceCount,
      paragraphs: paragraphCount,
      paragraphsByNewline: paragraphCountByNewline,
      readingTime,
      speakingTime,
      averageWordLength: Math.round(averageWordLength * 100) / 100,
      averageSentenceLength: Math.round(averageSentenceLength * 100) / 100,
      longestWord,
      shortestWord,
      mostCommonWords,
      characterFrequency,
    };
  }, [state.text, state.caseSensitive]);

  const handleTextChange = (value: string) => {
    setState((prev) => ({ ...prev, text: value }));
  };

  const StatCard = ({
    label,
    value,
    unit,
  }: {
    label: string;
    value: number | string;
    unit?: string;
  }) => (
    <div className="bg-muted/50 p-4 rounded-lg">
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Character/Word Counter"
        description="Count characters, words, lines, sentences and more in real-time"
      />

      <ToolToolbar>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-spaces"
            checked={state.includeSpaces}
            onCheckedChange={(checked) =>
              setState((prev) => ({ ...prev, includeSpaces: !!checked }))
            }
          />
          <Label htmlFor="include-spaces">Include spaces</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="case-sensitive"
            checked={state.caseSensitive}
            onCheckedChange={(checked) =>
              setState((prev) => ({ ...prev, caseSensitive: !!checked }))
            }
          />
          <Label htmlFor="case-sensitive">Case sensitive</Label>
        </div>
        <ToolClearButton onClear={() => clearState()} />
      </ToolToolbar>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={state.includeSpaces ? "Characters" : "Characters (no spaces)"}
          value={
            state.includeSpaces ? stats.characters : stats.charactersNoSpaces
          }
        />
        <StatCard label="Words" value={stats.words} />
        <StatCard label="Lines" value={stats.lines} />
        <StatCard label="Sentences" value={stats.sentences} />
        <StatCard label="Paragraphs" value={stats.paragraphs} />
        <StatCard label="Reading Time" value={stats.readingTime} unit="min" />
        <StatCard label="Speaking Time" value={stats.speakingTime} unit="min" />
        <StatCard
          label="Avg Word Length"
          value={stats.averageWordLength}
          unit="chars"
        />
      </div>

      <ToolEditorGrid>
        <ToolEditorPanel label="Text Input">
          <AppCodeMirror
            value={state.text}
            className="h-[calc(100vh-17rem)]"
            height="100%"
            onChange={handleTextChange}
            placeholder="Paste or type your text here..."
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
            }}
          />
        </ToolEditorPanel>

        <ToolEditorPanel label="Analysis">
          <ScrollArea className="h-[calc(100vh-17rem)]">
            <div className="space-y-4 pr-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-4">Most Common Words</h3>
                {stats.mostCommonWords.length > 0 ? (
                  <div className="space-y-2">
                    {stats.mostCommonWords.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="font-mono text-sm">{item.word}</span>
                        <span className="text-muted-foreground">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Enter text to see word frequency
                  </p>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-4">Character Frequency</h3>
                {stats.characterFrequency.length > 0 ? (
                  <div className="space-y-2">
                    {stats.characterFrequency.slice(0, 10).map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="font-mono text-sm">
                          {item.char === " " ? "(space)" : item.char}
                        </span>
                        <span className="text-muted-foreground">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Enter text to see character frequency
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        </ToolEditorPanel>
      </ToolEditorGrid>
    </ToolPageContainer>
  );
}
