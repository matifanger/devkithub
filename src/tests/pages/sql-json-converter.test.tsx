import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@codemirror/lang-sql", () => ({
  sql: vi.fn(() => ({})),
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
      direction: "sql-to-json",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

vi.mock("sql-formatter", () => ({
  format: vi.fn((sql) => sql),
}));

import { SqlJsonConverterPage } from "../../pages/sql-json-converter";

describe("SqlJsonConverterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<SqlJsonConverterPage />);
    expect(screen.getByText("SQL ↔ JSON Converter")).toBeDefined();
  });

  it("renders page description", () => {
    render(<SqlJsonConverterPage />);
    expect(
      screen.getByText("Convert between SQL and JSON formats"),
    ).toBeDefined();
  });

  it("renders direction selector", () => {
    render(<SqlJsonConverterPage />);
    expect(screen.getByText("Direction:")).toBeDefined();
  });

  it("renders Sample button", () => {
    render(<SqlJsonConverterPage />);
    expect(screen.getByText("Sample")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<SqlJsonConverterPage />);
    expect(screen.getAllByText("Clear").length).toBeGreaterThan(0);
  });

  it("renders input label for SQL", () => {
    render(<SqlJsonConverterPage />);
    expect(screen.getByText("Input SQL")).toBeDefined();
  });

  it("renders output label", () => {
    render(<SqlJsonConverterPage />);
    expect(screen.getByText("Output JSON")).toBeDefined();
  });
});
