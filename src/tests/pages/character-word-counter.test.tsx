import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      text: "",
      countMode: "all",
      includeSpaces: true,
      caseSensitive: false,
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

import { CharacterWordCounterPage } from "../../pages/character-word-counter";

describe("CharacterWordCounterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<CharacterWordCounterPage />);
    expect(screen.getByText("Character/Word Counter")).toBeDefined();
  });

  it("renders page description", () => {
    render(<CharacterWordCounterPage />);
    expect(
      screen.getByText(
        "Count characters, words, lines, sentences and more in real-time",
      ),
    ).toBeDefined();
  });

  it("renders text input area", () => {
    render(<CharacterWordCounterPage />);
    expect(
      screen.getByPlaceholderText("Paste or type your text here..."),
    ).toBeDefined();
  });

  it("renders include spaces checkbox", () => {
    render(<CharacterWordCounterPage />);
    expect(screen.getByText("Include spaces")).toBeDefined();
  });

  it("renders case sensitive checkbox", () => {
    render(<CharacterWordCounterPage />);
    expect(screen.getByText("Case sensitive")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<CharacterWordCounterPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders statistics cards", () => {
    render(<CharacterWordCounterPage />);
    expect(screen.getByText("Characters")).toBeDefined();
    expect(screen.getByText("Words")).toBeDefined();
    expect(screen.getByText("Lines")).toBeDefined();
    expect(screen.getByText("Sentences")).toBeDefined();
  });

  it("renders time estimation cards", () => {
    render(<CharacterWordCounterPage />);
    expect(screen.getByText("Reading Time")).toBeDefined();
    expect(screen.getByText("Speaking Time")).toBeDefined();
  });

  it("renders text input section", () => {
    render(<CharacterWordCounterPage />);
    expect(screen.getByText("Text Input")).toBeDefined();
  });

  it("renders most common words section", () => {
    render(<CharacterWordCounterPage />);
    expect(screen.getByText("Most Common Words")).toBeDefined();
  });

  it("renders character frequency section", () => {
    render(<CharacterWordCounterPage />);
    expect(screen.getByText("Character Frequency")).toBeDefined();
  });
});
