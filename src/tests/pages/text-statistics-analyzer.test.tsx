import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      text: "",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

import { TextStatisticsAnalyzerPage } from "../../pages/text-statistics-analyzer";

describe("TextStatisticsAnalyzerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", () => {
    render(<TextStatisticsAnalyzerPage />);
    expect(screen.getByText("Text Statistics Analyzer")).toBeDefined();
    expect(
      screen.getByText(
        "Analyze text and get detailed statistics about your content",
      ),
    ).toBeDefined();
  });

  it("renders input text area", () => {
    render(<TextStatisticsAnalyzerPage />);
    expect(screen.getByText("Input Text")).toBeDefined();
    expect(
      screen.getByPlaceholderText("Paste or type your text here..."),
    ).toBeDefined();
  });

  it("renders statistics section", () => {
    render(<TextStatisticsAnalyzerPage />);
    expect(screen.getByText("Statistics")).toBeDefined();
  });

  it("renders character count", () => {
    render(<TextStatisticsAnalyzerPage />);
    expect(screen.getByText("Total Characters")).toBeDefined();
  });

  it("renders word count", () => {
    render(<TextStatisticsAnalyzerPage />);
    expect(screen.getByText("Words")).toBeDefined();
  });
});
