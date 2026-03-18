import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

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
      direction: "csv-to-tsv",
      hasHeader: true,
      delimiter: ",",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

vi.mock("papaparse", () => ({
  __esModule: true,
  default: {
    parse: vi.fn((data, options) => ({
      data: [
        ["name", "age"],
        ["John", "30"],
      ],
      errors: [],
    })),
    unparse: vi.fn((data, options) => "name,age\nJohn,30"),
  },
}));

import { CsvTsvConverterPage } from "../../pages/csv-tsv-converter";

describe("CsvTsvConverterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<CsvTsvConverterPage />);
    expect(screen.getByText("CSV ↔ TSV Converter")).toBeDefined();
  });

  it("renders page description", () => {
    render(<CsvTsvConverterPage />);
    expect(
      screen.getByText("Convert between CSV and TSV formats"),
    ).toBeDefined();
  });

  it("renders direction selector", () => {
    render(<CsvTsvConverterPage />);
    expect(screen.getByText("Direction:")).toBeDefined();
  });

  it("renders has header checkbox", () => {
    render(<CsvTsvConverterPage />);
    expect(screen.getByText("First row is header")).toBeDefined();
  });

  it("renders Sample button", () => {
    render(<CsvTsvConverterPage />);
    expect(screen.getByText("Sample")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<CsvTsvConverterPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders input label for CSV", () => {
    render(<CsvTsvConverterPage />);
    expect(screen.getByText("Input CSV")).toBeDefined();
  });

  it("renders output label for TSV", () => {
    render(<CsvTsvConverterPage />);
    expect(screen.getByText("Output TSV")).toBeDefined();
  });
});
