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
      options: {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        debugProtection: false,
        disableConsoleOutput: false,
        identifierNamesGenerator: "hexadecimal",
        numbersToExpressions: false,
        selfDefending: false,
        shuffleStringArray: true,
        stringArray: true,
        stringArrayEncoding: "none",
      },
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

vi.mock("javascript-obfuscator", () => ({
  __esModule: true,
  default: {
    obfuscate: vi.fn(() => ({
      getObfuscatedCode: vi.fn(() => "obfuscated_code"),
    })),
  },
}));

import { JsObfuscatorPage } from "../../pages/js-obfuscator";

describe("JsObfuscatorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<JsObfuscatorPage />);
    expect(screen.getByText("JavaScript Obfuscator")).toBeDefined();
  });

  it("renders page description", () => {
    render(<JsObfuscatorPage />);
    expect(
      screen.getByText("Obfuscate JavaScript code to protect your source"),
    ).toBeDefined();
  });

  it("renders Obfuscate button", () => {
    render(<JsObfuscatorPage />);
    expect(screen.getByText("Obfuscate")).toBeDefined();
  });

  it("renders Sample button", () => {
    render(<JsObfuscatorPage />);
    expect(screen.getByText("Sample")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<JsObfuscatorPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders Basic Options section", () => {
    render(<JsObfuscatorPage />);
    expect(screen.getByText("Basic Options")).toBeDefined();
  });

  it("renders Advanced Options section", () => {
    render(<JsObfuscatorPage />);
    expect(screen.getByText("Advanced Options")).toBeDefined();
  });

  it("renders Protection Options section", () => {
    render(<JsObfuscatorPage />);
    expect(screen.getByText("Protection Options")).toBeDefined();
  });

  it("renders input label", () => {
    render(<JsObfuscatorPage />);
    expect(screen.getByText("Input JavaScript")).toBeDefined();
  });

  it("renders output label", () => {
    render(<JsObfuscatorPage />);
    expect(screen.getByText("Obfuscated Output")).toBeDefined();
  });
});
