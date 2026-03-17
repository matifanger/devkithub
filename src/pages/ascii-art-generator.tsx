/**
 * ASCII Art Generator
 *
 * Creates ASCII art text banners from input text using FIGlet fonts.
 *
 * Features:
 * - 50+ font styles (standard, slant, block, bubble, digital, etc.)
 * - Real-time preview
 * - Copy to clipboard
 * - Auto-save state
 *
 * How to use:
 * 1. Enter text to convert
 * 2. Select font style
 * 3. Copy result
 */

import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { CopyButton } from "../components/ui/copy-button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToolState } from "../hooks/useToolState";

interface AsciiArtState {
  text: string;
  font: string;
}

const initialState: AsciiArtState = {
  text: "Hello",
  font: "Standard",
};

const FONTS = [
  "Standard",
  "Ghost",
  "Doom",
  "Big",
  "Slant",
  "Shadow",
  "Small",
  "Banner",
  "Bubble",
  "Digital",
  "Rectangles",
  "Lean",
  "Term",
  "Big Chief",
  "Colossal",
  "Crazy",
  "Epic",
  "Larry 3D",
  "Nancyj-Fancy",
  "Ogre",
  "Puffy",
  "Rammstein",
  "Star Wars",
  "Stop",
  "Three Point",
  "USA Flag",
  "Varsity",
];

export function AsciiArtGeneratorPage() {
  const [state, setState, clearState] = useToolState(
    "ascii-art-generator",
    initialState,
  );
  const [asciiArt, setAsciiArt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generate = async () => {
      if (!state.text.trim()) {
        setAsciiArt("");
        return;
      }
      setIsLoading(true);
      try {
        const result = await window.figlet.text(state.text, state.font);
        setAsciiArt(result);
      } catch (err) {
        console.error("Figlet error:", err);
        setAsciiArt(state.text);
      }
      setIsLoading(false);
    };
    generate();
  }, [state.text, state.font]);

  const handleTextChange = (text: string) => {
    setState((prev) => ({ ...prev, text }));
  };

  const handleFontChange = (font: string) => {
    setState((prev) => ({ ...prev, font }));
  };

  const handleClear = () => {
    setState(initialState);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">ASCII Art Generator</h1>
        <p className="text-muted-foreground">
          Create ASCII art text banners using FIGlet fonts
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Text</Label>
              <Input
                value={state.text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter text"
              />
            </div>
            <div className="space-y-2">
              <Label>Font Style</Label>
              <Select value={state.font} onValueChange={handleFontChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {FONTS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setState(initialState)}>Sample</Button>
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Output</CardTitle>
            <CopyButton value={asciiArt} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground p-4">Loading...</div>
            ) : (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre">
                {asciiArt || "Enter text..."}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
