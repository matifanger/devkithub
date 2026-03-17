import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      unitSystem: "metric",
      heightCm: "",
      weightKg: "",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

import { BMICalculatorPage } from "../../pages/bmi-calculator";

describe("BMICalculatorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", () => {
    render(<BMICalculatorPage />);
    expect(screen.getByText("BMI Calculator")).toBeDefined();
    expect(
      screen.getByText(
        "Calculate your Body Mass Index and check your health category",
      ),
    ).toBeDefined();
  });

  it("renders Input section", () => {
    render(<BMICalculatorPage />);
    expect(screen.getByText("Input")).toBeDefined();
  });

  it("renders unit system selector", () => {
    render(<BMICalculatorPage />);
    expect(screen.getByText("Unit System")).toBeDefined();
  });

  it("renders Results section", () => {
    render(<BMICalculatorPage />);
    expect(screen.getByText("Results")).toBeDefined();
  });

  it("renders Clear button", () => {
    render(<BMICalculatorPage />);
    expect(screen.getByText("Clear")).toBeDefined();
  });
});
