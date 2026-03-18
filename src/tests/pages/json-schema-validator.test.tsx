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
      schema: "",
      data: "",
      schemaFormat: "2",
    });
    return [state, setState, vi.fn()] as const;
  }),
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

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      schema: "",
      data: "",
      schemaFormat: "2",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

import { JsonSchemaValidatorPage } from "../../pages/json-schema-validator";

describe("JsonSchemaValidatorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<JsonSchemaValidatorPage />);
    expect(screen.getByText("JSON Schema Validator")).toBeDefined();
  });

  it("renders page description", () => {
    render(<JsonSchemaValidatorPage />);
    expect(
      screen.getByText("Validate JSON data against JSON Schema definitions"),
    ).toBeDefined();
  });

  it("renders JSON Schema input label", () => {
    render(<JsonSchemaValidatorPage />);
    expect(screen.getByText("JSON Schema")).toBeDefined();
  });

  it("renders JSON Data input label", () => {
    render(<JsonSchemaValidatorPage />);
    expect(screen.getByText("JSON Data")).toBeDefined();
  });

  it("renders Format Schema button", () => {
    render(<JsonSchemaValidatorPage />);
    expect(screen.getByText("Format Schema")).toBeDefined();
  });

  it("renders Format Data button", () => {
    render(<JsonSchemaValidatorPage />);
    expect(screen.getByText("Format Data")).toBeDefined();
  });

  it("renders Sample button", () => {
    render(<JsonSchemaValidatorPage />);
    expect(screen.getByText("Sample")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<JsonSchemaValidatorPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders Spaces selector", () => {
    render(<JsonSchemaValidatorPage />);
    expect(screen.getByText("Spaces:")).toBeDefined();
  });
});
