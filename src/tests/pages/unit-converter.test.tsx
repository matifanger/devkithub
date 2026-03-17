import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      category: "length",
      inputValue: "",
      fromUnit: "meter",
      toUnit: "kilometer",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

import { UnitConverterPage } from "../../pages/unit-converter";

describe("UnitConverterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", () => {
    render(<UnitConverterPage />);
    expect(screen.getByText("Unit Converter")).toBeDefined();
    expect(
      screen.getByText("Convert values between different units of measurement"),
    ).toBeDefined();
  });

  it("renders category selector", () => {
    render(<UnitConverterPage />);
    expect(screen.getByText("Category")).toBeDefined();
  });

  it("renders conversion section", () => {
    render(<UnitConverterPage />);
    expect(screen.getByText("Conversion")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<UnitConverterPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });
});
