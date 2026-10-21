import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UuidValidatorPage } from "../../pages/uuid-validator";
import { allTools } from "../../utils/tools-data";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("UUID Validator page", () => {
  it("is registered in the tool catalog", () => {
    expect(allTools.find((tool) => tool.id === "uuid-validator")).toMatchObject(
      {
        title: "UUID Validator",
        url: "/uuid-validator",
        category: "development",
      },
    );
  });

  it("starts neutral and validates while typing", () => {
    render(<UuidValidatorPage />);
    expect(
      screen.getByRole("heading", { name: "UUID Validator" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Invalid UUID")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("UUID"), {
      target: { value: "550e8400e29b41d4a716446655440000" },
    });
    expect(screen.getByText("Valid UUID")).toBeInTheDocument();
    expect(screen.getByText("v4 — Random")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy canonical" }),
    ).toBeInTheDocument();
  });

  it("replaces old details with errors on invalid input", () => {
    render(<UuidValidatorPage />);
    fireEvent.click(screen.getByRole("button", { name: "Load v1 example" }));
    expect(screen.getByText("2022-02-22T19:22:22.000Z")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Load Invalid example" }),
    );
    expect(screen.getByText("Invalid UUID")).toBeInTheDocument();
    expect(
      screen.getByText(/Invalid character at position/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Embedded timestamp (UTC)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy canonical" }),
    ).not.toBeInTheDocument();
  });

  it("loads v7 and Nil examples and clears the input and result", async () => {
    render(<UuidValidatorPage />);
    fireEvent.click(screen.getByRole("button", { name: "Load v7 example" }));
    expect(screen.getByText("1645557742000")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load Nil example" }));
    expect(screen.getByText("Not applicable (Nil)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(screen.getByLabelText("UUID")).toHaveValue(""));
    expect(screen.queryByText("Valid UUID")).not.toBeInTheDocument();
    expect(screen.queryByText("UUID details")).not.toBeInTheDocument();
  });

  it("copies normalized values and a serializable report", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<UuidValidatorPage />);
    fireEvent.click(screen.getByRole("button", { name: "Load v1 example" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy canonical" }));
    expect(writeText).toHaveBeenLastCalledWith(
      "c232ab00-9414-11ec-b3c8-9f6bdeced846",
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy report" }));
    expect(JSON.parse(writeText.mock.calls[1][0])).toMatchObject({
      valid: true,
      version: 1,
      timestampTicks: "138648505420000000",
    });
  });
});
