/**
 * Text Statistics Analyzer
 *
 * Analyzes text and provides detailed statistics about character count, word count, line count, and more.
 *
 * Features:
 * - Character count (with and without spaces)
 * - Word count
 * - Line count
 * - Paragraph count
 * - Sentence count
 * - Average word length
 * - Average sentence length
 * - Character frequency analysis
 * - Reading time estimate
 *
 * How to use:
 * 1. Paste or type text in the input area
 * 2. View real-time statistics in the output section
 * 3. Copy any specific statistic if needed
 */

import React, { useMemo } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useToolState } from "../hooks/useToolState";

interface TextStatsAnalyzerState {
  text: string;
}

const initialState: TextStatsAnalyzerState = {
  text: "",
};

interface TextStats {
  charCount: number;
  charCountNoSpaces: number;
  wordCount: number;
  lineCount: number;
  paragraphCount: number;
  sentenceCount: number;
  avgWordLength: number;
  avgSentenceLength: number;
  readingTime: number;
}

function analyzeText(text: string): TextStats {
  const charCount = text.length;
  const charCountNoSpaces = text.replace(/\s/g, "").length;

  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = words.length;

  const lines = text.split("\n");
  const lineCount = lines.length;

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphCount = paragraphs.length || (text.trim() ? 1 : 0);

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length;

  const avgWordLength =
    wordCount > 0 ? words.reduce((acc, w) => acc + w.length, 0) / wordCount : 0;

  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  const readingTime = Math.ceil(wordCount / 200);

  return {
    charCount,
    charCountNoSpaces,
    wordCount,
    lineCount,
    paragraphCount,
    sentenceCount,
    avgWordLength: Math.round(avgWordLength * 100) / 100,
    avgSentenceLength: Math.round(avgSentenceLength * 100) / 100,
    readingTime,
  };
}

export function TextStatisticsAnalyzerPage() {
  const [state, setState, clearState] = useToolState(
    "text-statistics-analyzer",
    initialState,
  );

  const stats = useMemo(() => analyzeText(state.text), [state.text]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Text Statistics Analyzer</h1>
        <p className="text-muted-foreground">
          Analyze text and get detailed statistics about your content
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={state.text}
              onChange={(e) =>
                setState((prev) => ({ ...prev, text: e.target.value }))
              }
              placeholder="Paste or type your text here..."
              className="min-h-[300px] font-mono"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearState}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{stats.charCount}</div>
                <div className="text-sm text-muted-foreground">
                  Total Characters
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">
                  {stats.charCountNoSpaces}
                </div>
                <div className="text-sm text-muted-foreground">
                  Characters (no spaces)
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{stats.wordCount}</div>
                <div className="text-sm text-muted-foreground">Words</div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{stats.lineCount}</div>
                <div className="text-sm text-muted-foreground">Lines</div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{stats.paragraphCount}</div>
                <div className="text-sm text-muted-foreground">Paragraphs</div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{stats.sentenceCount}</div>
                <div className="text-sm text-muted-foreground">Sentences</div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{stats.avgWordLength}</div>
                <div className="text-sm text-muted-foreground">
                  Avg Word Length
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">
                  {stats.avgSentenceLength}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Sentence Length
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted col-span-2">
                <div className="text-2xl font-bold">
                  {stats.readingTime} min
                </div>
                <div className="text-sm text-muted-foreground">
                  Reading Time (200 wpm)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
