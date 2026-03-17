import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      text: "Hello",
      font: "standard",
      width: 80,
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

import { AsciiArtGeneratorPage } from "../../pages/ascii-art-generator";

describe("AsciiArtGeneratorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", () => {
    render(<AsciiArtGeneratorPage />);
    expect(screen.getByText("ASCII Art Generator")).toBeDefined();
    expect(
      screen.getByText("Create ASCII art text banners using FIGlet fonts"),
    ).toBeDefined();
  });

  it("renders input section with text input", () => {
    render(<AsciiArtGeneratorPage />);
    expect(screen.getByText("Input")).toBeDefined();
    expect(screen.getByPlaceholderText("Enter text")).toBeDefined();
  });

  it("renders font style selector", () => {
    render(<AsciiArtGeneratorPage />);
    expect(screen.getByText("Font Style")).toBeDefined();
  });

  it("renders Sample and Clear buttons", () => {
    render(<AsciiArtGeneratorPage />);
    expect(screen.getByText("Sample")).toBeDefined();
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders output section", () => {
    render(<AsciiArtGeneratorPage />);
    expect(screen.getByText("Output")).toBeDefined();
  });
});
