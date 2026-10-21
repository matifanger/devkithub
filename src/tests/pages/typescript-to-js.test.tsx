import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@codemirror/lang-javascript", () => ({
  javascript: vi.fn(() => ({})),
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
      target: "es2018",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

vi.mock("sucrase", () => ({
  __esModule: true,
  transform: vi.fn((code, options) => ({
    code: code.replace(/:\s*\w+/g, ""),
  })),
}));

import { TypescriptToJsPage } from "../../pages/typescript-to-js";

describe("TypescriptToJsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<TypescriptToJsPage />);
    expect(screen.getByText("TypeScript to JavaScript")).toBeDefined();
  });

  it("renders page description", () => {
    render(<TypescriptToJsPage />);
    expect(
      screen.getByText("Convert TypeScript code to JavaScript"),
    ).toBeDefined();
  });

  it("renders Sample button", () => {
    render(<TypescriptToJsPage />);
    expect(screen.getByText("Sample")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<TypescriptToJsPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders input label", () => {
    render(<TypescriptToJsPage />);
    expect(screen.getByText("Input TypeScript")).toBeDefined();
  });

  it("renders output label", () => {
    render(<TypescriptToJsPage />);
    expect(screen.getByText("Output JavaScript")).toBeDefined();
  });
});
