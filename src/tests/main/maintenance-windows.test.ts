// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { randomUUID } from "crypto";
import { runPowerShell, STARTUP_SCRIPT } from "../../main/maintenance/windows";

// Exercise the exact Windows implementation against private fixture keys and
// folders. Never touch the user's actual Run keys or Startup folders.
describe.runIf(process.platform === "win32")(
  "Windows startup round trips",
  () => {
    const testKey = `Software\\DevKitHub\\MaintenanceTests\\${randomUUID()}`;
    let fixture: string;
    let script: string;
    type Entry = {
      name: string;
      command: string;
      source: string;
      enabled: boolean;
      manageable: boolean;
      stamp?: string;
      length?: number;
    };
    const quoted = (value: string) => `'${value.replace(/'/g, "''")}'`;
    const list = () => runPowerShell<Entry[]>(script, { action: "list" });
    async function toggle(entry: Entry, enabled: boolean) {
      return runPowerShell(script, {
        ...entry,
        action: "toggle",
        wasEnabled: entry.enabled,
        enabled,
      });
    }
    beforeAll(async () => {
      fixture = await fs.mkdtemp(
        path.join(os.tmpdir(), "devkithub-startup-test-"),
      );
      await fs.mkdir(path.join(fixture, "startup"));
      await fs.mkdir(path.join(fixture, "common"));
      script = STARTUP_SCRIPT.replace(
        "'Software\\Microsoft\\Windows\\CurrentVersion\\Run'",
        quoted(`${testKey}\\Run`),
      )
        .replace(
          "'Software\\DevKitHub\\Maintenance\\DisabledRun'",
          quoted(`${testKey}\\DisabledRun`),
        )
        .replace(
          "[Environment]::GetFolderPath('Startup')",
          quoted(path.join(fixture, "startup")),
        )
        .replace(
          "[Environment]::GetFolderPath('CommonStartup')",
          quoted(path.join(fixture, "common")),
        )
        .replace(
          "Join-Path ([Environment]::GetFolderPath('ApplicationData')) 'DevKitHub\\Maintenance\\DisabledStartup'",
          quoted(path.join(fixture, "disabled")),
        )
        .replace("@('CurrentUser', 'LocalMachine')", "@('CurrentUser')");
      const setup = String.raw`
      $key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey($request.key + '\Run')
      try { $key.SetValue('Fixture é & $test', '%USERPROFILE%\My App\start.exe --flag "a&b"', [Microsoft.Win32.RegistryValueKind]::ExpandString) } finally { $key.Dispose() }
      '{"ok":true}'
    `;
      await runPowerShell(setup, { key: testKey });
    });
    afterAll(async () => {
      if (!testKey.startsWith("Software\\DevKitHub\\MaintenanceTests\\"))
        throw new Error("Invalid registry fixture");
      await runPowerShell(
        "[Microsoft.Win32.Registry]::CurrentUser.DeleteSubKeyTree($request.key, $false); '{\"ok\":true}'",
        { key: testKey },
      );
      if (
        !path.basename(fixture).startsWith("devkithub-startup-test-") ||
        path.dirname(fixture) !== path.resolve(os.tmpdir())
      )
        throw new Error("Invalid startup fixture");
      await fs.rm(fixture, { recursive: true, force: true });
    });
    it("preserves Unicode names, command quoting, environment variables and registry type", async () => {
      const initial = (await list()).find(
        (entry) => entry.name === "Fixture é & $test",
      )!;
      expect(initial.command).toContain("%USERPROFILE%");
      await toggle(initial, false);
      const disabled = (await list()).find(
        (entry) =>
          entry.name === initial.name && entry.source === initial.source,
      )!;
      expect(disabled.enabled).toBe(false);
      expect(disabled.command).toBe(initial.command);
      await toggle(disabled, true);
      const restored = (await list()).find(
        (entry) =>
          entry.name === initial.name && entry.source === initial.source,
      )!;
      expect(restored.enabled).toBe(true);
      expect(restored.command).toBe(initial.command);
      const kind = await runPowerShell<string>(
        "$k = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($request.key + '\\Run'); try { ConvertTo-Json -InputObject $k.GetValueKind($request.name).ToString() } finally { $k.Dispose() }",
        { key: testKey, name: initial.name },
      );
      expect(kind).toBe("ExpandString");
    }, 30000);
    it("rejects stale registry commands rather than overwriting a changed entry", async () => {
      const entry = (await list())[0];
      await expect(
        toggle({ ...entry, command: "stale command" }, false),
      ).rejects.toThrow("changed");
      expect(
        (await list()).find((row) => row.name === entry.name)?.enabled,
      ).toBe(true);
    }, 15000);
    it("moves personal startup files out and restores their exact contents", async () => {
      const target = path.join(fixture, "startup", "Fixture é.lnk");
      await fs.writeFile(target, "fixture content, never executed");
      const entry = (await list()).find((row) => row.name === "Fixture é.lnk")!;
      await toggle(entry, false);
      await expect(fs.stat(target)).rejects.toThrow();
      const disabled = (await list()).find((row) => row.name === entry.name)!;
      expect(disabled.enabled).toBe(false);
      await toggle(disabled, true);
      expect(await fs.readFile(target, "utf8")).toBe(
        "fixture content, never executed",
      );
    }, 20000);
  },
);
