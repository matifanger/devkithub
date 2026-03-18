import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@codemirror/lang-json", () => ({
  json: vi.fn(() => ({})),
}));

vi.mock("@codemirror/view", () => ({
  EditorView: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    dispatch: vi.fn(),
  })),
  lineWrapping: vi.fn(),
}));

vi.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: vi.fn(({ value, onChange, placeholder, "data-testid": testId }) => {
    return (
      <textarea
        data-testid={testId || "codemirror"}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    );
  }),
}));

vi.mock("@uiw/codemirror-themes-all", () => ({}));

vi.mock("../../components/app-code-mirror", () => ({
  AppCodeMirror: vi.fn(
    ({ value, onChange, placeholder, "data-testid": testId }) => {
      return (
        <textarea
          data-testid={testId || "codemirror"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
        />
      );
    },
  ),
}));

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      input: "",
      output: "",
      direction: "ini-to-json",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

vi.mock("ini", () => ({
  __esModule: true,
  default: {
    parse: vi.fn((ini) => ({ parsed: ini })),
    stringify: vi.fn((obj) => "[parsed]"),
  },
}));

import { IniParserPage } from "../../pages/ini-parser";

describe("IniParserPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<IniParserPage />);
    expect(screen.getByText("INI Parser")).toBeDefined();
  });

  it("renders page description", () => {
    render(<IniParserPage />);
    expect(
      screen.getByText("Convert between INI and JSON formats"),
    ).toBeDefined();
  });

  it("renders direction selector", () => {
    render(<IniParserPage />);
    expect(screen.getByText("Direction:")).toBeDefined();
  });

  it("renders Format button", () => {
    render(<IniParserPage />);
    expect(screen.getByText("Format")).toBeDefined();
  });

  it("renders Sample button", () => {
    render(<IniParserPage />);
    expect(screen.getByText("Sample")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<IniParserPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders input label for INI", () => {
    render(<IniParserPage />);
    expect(screen.getByText("Input INI")).toBeDefined();
  });

  it("renders output label for JSON", () => {
    render(<IniParserPage />);
    expect(screen.getByText("Output JSON")).toBeDefined();
  });
});
