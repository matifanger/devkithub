import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

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
  default: vi.fn(
    ({ value, onChange, placeholder, readOnly, "data-testid": testId }) => {
      return (
        <textarea
          data-testid={testId || "codemirror"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      );
    },
  ),
}));

vi.mock("@uiw/codemirror-themes-all", () => ({}));

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      algorithm: "HS256",
      secret: "",
      claims: [
        { key: "sub", value: "1234567890", type: "string" as const },
        { key: "name", value: "John Doe", type: "string" as const },
      ],
      showSecret: false,
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

import { JwtBuilderPage } from "../../pages/jwt-builder";

describe("JwtBuilderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", () => {
    render(<JwtBuilderPage />);

    expect(screen.getByText("JWT Builder")).toBeDefined();
    expect(screen.getByText("Create and sign JSON Web Tokens")).toBeDefined();
  });

  it("renders algorithm selector with default value", () => {
    render(<JwtBuilderPage />);

    expect(screen.getByText("HS256")).toBeDefined();
  });

  it("renders secret input field", () => {
    render(<JwtBuilderPage />);

    const secretInput = screen.getByPlaceholderText("Enter your secret key");
    expect(secretInput).toBeDefined();
  });

  it("renders claims section with default claims", () => {
    render(<JwtBuilderPage />);

    expect(screen.getByDisplayValue("sub")).toBeDefined();
    expect(screen.getByDisplayValue("1234567890")).toBeDefined();
    expect(screen.getByDisplayValue("name")).toBeDefined();
    expect(screen.getByDisplayValue("John Doe")).toBeDefined();
  });

  it("renders Generate Token button", () => {
    render(<JwtBuilderPage />);

    expect(screen.getByText("Generate Token")).toBeDefined();
  });

  it("renders Sample button", () => {
    render(<JwtBuilderPage />);

    expect(screen.getByText("Sample")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<JwtBuilderPage />);

    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders Add Claim button", () => {
    render(<JwtBuilderPage />);

    expect(screen.getByText("Add Claim")).toBeDefined();
  });

  it("renders standard claim buttons", () => {
    render(<JwtBuilderPage />);

    expect(screen.getByText("+ exp")).toBeDefined();
    expect(screen.getByText("+ nbf")).toBeDefined();
    expect(screen.getByText("+ iat")).toBeDefined();
    expect(screen.getByText("+ jti")).toBeDefined();
  });

  it("shows error when generating token without secret", async () => {
    render(<JwtBuilderPage />);

    const generateButton = screen.getByText("Generate Token");
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Secret is required")).toBeDefined();
    });
  });

  it("renders select dropdowns for claim types", () => {
    render(<JwtBuilderPage />);

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });
});
