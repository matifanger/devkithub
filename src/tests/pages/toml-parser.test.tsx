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
      direction: "toml-to-json",
      spaces: "2",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

vi.mock("@iarna/toml", () => ({
  __esModule: true,
  parse: vi.fn((toml) => ({ parsed: toml })),
  stringify: vi.fn((obj) => "[parsed]"),
}));

import { TomlParserPage } from "../../pages/toml-parser";

describe("TomlParserPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<TomlParserPage />);
    expect(screen.getByText("TOML Parser")).toBeDefined();
  });

  it("renders page description", () => {
    render(<TomlParserPage />);
    expect(
      screen.getByText("Convert between TOML and JSON formats"),
    ).toBeDefined();
  });

  it("renders direction selector", () => {
    render(<TomlParserPage />);
    expect(screen.getByText("Direction:")).toBeDefined();
  });

  it("renders spaces selector", () => {
    render(<TomlParserPage />);
    expect(screen.getByText("Spaces:")).toBeDefined();
  });

  it("renders Format button", () => {
    render(<TomlParserPage />);
    expect(screen.getByText("Format")).toBeDefined();
  });

  it("renders Sample button", () => {
    render(<TomlParserPage />);
    expect(screen.getByText("Sample")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<TomlParserPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders input label for TOML", () => {
    render(<TomlParserPage />);
    expect(screen.getByText("Input TOML")).toBeDefined();
  });

  it("renders output label for JSON", () => {
    render(<TomlParserPage />);
    expect(screen.getByText("Output JSON")).toBeDefined();
  });
});
