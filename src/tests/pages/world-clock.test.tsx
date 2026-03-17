import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      cities: [],
      convertFrom: "America/New_York",
      convertTo: "Europe/London",
      convertTime: "12:00",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

import { WorldClockPage } from "../../pages/world-clock";

describe("WorldClockPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", () => {
    render(<WorldClockPage />);
    expect(screen.getByText("World Clock")).toBeDefined();
    expect(
      screen.getByText(
        "View current time in multiple cities and convert between timezones",
      ),
    ).toBeDefined();
  });

  it("renders World Clock section", () => {
    render(<WorldClockPage />);
    expect(screen.getByText("World Clock")).toBeDefined();
  });

  it("renders Timezone Converter section", () => {
    render(<WorldClockPage />);
    expect(screen.getByText("Timezone Converter")).toBeDefined();
  });

  it("renders Add City selector", () => {
    render(<WorldClockPage />);
    expect(screen.getByText("Add City")).toBeDefined();
  });
});
