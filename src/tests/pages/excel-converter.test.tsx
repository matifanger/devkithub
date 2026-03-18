import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@codemirror/lang-json", () => ({
  json: vi.fn(() => ({})),
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
      direction: "excel-to-json",
      sheetName: "",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

vi.mock("xlsx", () => ({
  __esModule: true,
  read: vi.fn(() => ({
    SheetNames: ["Sheet1"],
    Sheets: { Sheet1: {} },
  })),
  utils: {
    sheet_to_json: vi.fn(() => [{ name: "test" }]),
    sheet_to_csv: vi.fn(() => "name,age\nJohn,30"),
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    write: vi.fn(() => "base64data"),
  },
}));

import { ExcelConverterPage } from "../../pages/excel-converter";

describe("ExcelConverterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<ExcelConverterPage />);
    expect(screen.getByText("Excel ↔ JSON/CSV Converter")).toBeDefined();
  });

  it("renders page description", () => {
    render(<ExcelConverterPage />);
    expect(
      screen.getByText("Convert between Excel files and JSON/CSV formats"),
    ).toBeDefined();
  });

  it("renders direction selector", () => {
    render(<ExcelConverterPage />);
    expect(screen.getByText("Direction:")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<ExcelConverterPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders input label", () => {
    render(<ExcelConverterPage />);
    expect(screen.getByText("Input (Base64 Excel)")).toBeDefined();
  });

  it("renders output label", () => {
    render(<ExcelConverterPage />);
    expect(screen.getByText("Output")).toBeDefined();
  });
});
