import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      isRunning: false,
      elapsed: 0,
      laps: [],
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

import { StopwatchPage } from "../../pages/stopwatch";

describe("StopwatchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", () => {
    render(<StopwatchPage />);
    expect(screen.getByText("Stopwatch")).toBeDefined();
    expect(
      screen.getByText("Precision timer for measuring elapsed time"),
    ).toBeDefined();
  });

  it("renders time display", () => {
    render(<StopwatchPage />);
    expect(screen.getByText("Time")).toBeDefined();
  });

  it("renders Start button", () => {
    render(<StopwatchPage />);
    expect(screen.getByText("Start")).toBeDefined();
  });

  it("renders Lap button", () => {
    render(<StopwatchPage />);
    expect(screen.getByText("Lap")).toBeDefined();
  });

  it("renders Reset button", () => {
    render(<StopwatchPage />);
    expect(screen.getByText("Reset")).toBeDefined();
  });
});
