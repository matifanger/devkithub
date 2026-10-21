import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../../contexts/auth-context";
import { useUpgradeModal } from "../../contexts/upgrade-modal-context";
import { ProtectedRoute } from "../../components/ProtectedRoute";

function Probe() {
  const access = useAuth();
  const tools = useUpgradeModal();
  return <ProtectedRoute><div>{access.isAuthenticated && tools.isPro ? "All tools available" : "Locked"}</div></ProtectedRoute>;
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("open-source access", () => {
  it("opens every tool on a clean installation without Electron credentials or a license server", () => {
    const request = vi.fn(() => { throw new Error("Offline"); });
    vi.stubGlobal("fetch", request);
    vi.stubGlobal("electron", undefined);
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByText("All tools available")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });
  it("does not re-lock access through legacy logout or development controls", async () => {
    const access = useAuth();
    access.logout(); access.setDevAuthenticated(false);
    expect((await access.validateStoredLicense()).success).toBe(true);
    expect(access.isAuthenticated).toBe(true);
    expect(access.needsValidation).toBe(false);
    expect(useUpgradeModal().isPro).toBe(true);
  });
});
