import React from "react";
import { ActivateLicenseResponse } from "../../../types/types";

export function LicenseTab(_props: { userData?: ActivateLicenseResponse | null }) {
  return <div className="p-6 space-y-4">
    <h2 className="text-lg font-semibold">Free and open source</h2>
    <p>All DevKitHub tools are free. No account, subscription, activation, or API key is required.</p>
    <p>Released under the MIT license. Third-party components retain their own licenses.</p>
    <button className="underline" onClick={() => window.electron.openExternal("https://github.com/matifanger/devkithub")}>View source and star on GitHub</button>
  </div>;
}
