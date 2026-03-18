import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@codemirror/lang-xml", () => ({
  xml: vi.fn(() => ({})),
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
      direction: "xml-to-json",
      spaces: "2",
      rootElement: "root",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

vi.mock("xml2js", () => ({
  __esModule: true,
  default: {
    Parser: vi.fn().mockImplementation(() => ({
      parseString: vi.fn((xml, callback) => {
        callback(null, { root: { item: "test" } });
      }),
    })),
    Builder: vi.fn().mockImplementation(() => ({
      buildObject: vi.fn(() => "<root><item>test</item></root>"),
    })),
  },
}));

import { XmlJsonConverterPage } from "../../pages/xml-json-converter";

describe("XmlJsonConverterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<XmlJsonConverterPage />);
    expect(screen.getByText("XML ↔ JSON Converter")).toBeDefined();
  });

  it("renders page description", () => {
    render(<XmlJsonConverterPage />);
    expect(
      screen.getByText("Convert between XML and JSON formats"),
    ).toBeDefined();
  });

  it("renders direction selector", () => {
    render(<XmlJsonConverterPage />);
    expect(screen.getByText("Direction:")).toBeDefined();
  });

  it("renders spaces selector", () => {
    render(<XmlJsonConverterPage />);
    expect(screen.getByText("Spaces:")).toBeDefined();
  });

  it("renders Format button", () => {
    render(<XmlJsonConverterPage />);
    expect(screen.getByText("Format")).toBeDefined();
  });

  it("renders Sample button", () => {
    render(<XmlJsonConverterPage />);
    expect(screen.getByText("Sample")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<XmlJsonConverterPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders input label for XML", () => {
    render(<XmlJsonConverterPage />);
    expect(screen.getByText("Input XML")).toBeDefined();
  });

  it("renders output label for JSON", () => {
    render(<XmlJsonConverterPage />);
    expect(screen.getByText("Output JSON")).toBeDefined();
  });
});
