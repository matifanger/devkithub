import { execFile } from "child_process";
import * as path from "path";
import type { StartupEntry, SystemOverview } from "../../types/maintenance";

// Script text is fixed. Names/commands travel as JSON over stdin, never as code.
export function runPowerShell<T>(
  script: string,
  input: unknown = {},
): Promise<T> {
  if (process.platform !== "win32")
    return Promise.reject(new Error("This feature requires Windows."));
  const prefix =
    "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue'; [Console]::InputEncoding = [Text.Encoding]::UTF8; [Console]::OutputEncoding = [Text.Encoding]::UTF8; $request = [Console]::In.ReadToEnd() | ConvertFrom-Json; ";
  const executable = path.join(
    process.env.SystemRoot || "C:\\Windows",
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
  return new Promise((resolve, reject) => {
    const guardedScript = `${prefix} try { ${script} } catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }`;
    const child = execFile(
      executable,
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-EncodedCommand",
        Buffer.from(guardedScript, "utf16le").toString("base64"),
      ],
      {
        windowsHide: true,
        timeout: 30_000,
        maxBuffer: 4 * 1024 * 1024,
        encoding: "utf8",
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim().slice(0, 800) || error.message));
          return;
        }
        try {
          resolve(JSON.parse(stdout.replace(/^\uFEFF/, "").trim()));
        } catch {
          reject(new Error("Windows returned an unreadable response."));
        }
      },
    );
    child.stdin?.on("error", () => {
      /* execFile reports process failures */
    });
    child.stdin?.end(JSON.stringify(input));
  });
}

export const DRIVE_SCRIPT = `
$items = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | ForEach-Object {
  @{ name = [string]$_.DeviceID; total = [double]$_.Size; free = [double]$_.FreeSpace }
})
ConvertTo-Json -InputObject $items -Compress
`;

// Only Run entries and Startup folders are in scope. RunOnce, services and
// scheduled tasks are deliberately left to Windows. Disabled values retain
// their exact type and unexpanded command in our separate registry key.
export const STARTUP_SCRIPT = String.raw`
$runPath = 'Software\Microsoft\Windows\CurrentVersion\Run'
$backupPath = 'Software\DevKitHub\Maintenance\DisabledRun'
$startupFolder = [Environment]::GetFolderPath('Startup')
$commonFolder = [Environment]::GetFolderPath('CommonStartup')
$disabledFolder = Join-Path ([Environment]::GetFolderPath('ApplicationData')) 'DevKitHub\Maintenance\DisabledStartup'
$raw = [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames
$rows = [Collections.Generic.List[object]]::new()
$views = @('Registry64', 'Registry32')
if (-not [Environment]::Is64BitOperatingSystem) { $views = @('Registry32') }
foreach ($view in $views) {
  foreach ($scope in @('CurrentUser', 'LocalMachine')) {
    $base = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::$scope, [Microsoft.Win32.RegistryView]::$view)
    try {
      foreach ($disabled in @($false, $true)) {
        if ($disabled -and $scope -ne 'CurrentUser') { continue }
        $keyPath = if ($disabled) { $backupPath } else { $runPath }
        $key = $base.OpenSubKey($keyPath)
        if ($null -eq $key) { continue }
        try {
          foreach ($name in $key.GetValueNames()) {
            $kind = $key.GetValueKind($name).ToString()
            if ($kind -notin @('String', 'ExpandString')) { continue }
            $command = [string]$key.GetValue($name, '', $raw)
            $source = "$scope/$view/Run"
            $rows.Add(@{ name=$name; command=$command; source=$source; enabled=(-not $disabled); manageable=($scope -eq 'CurrentUser'); kind=$kind; disabled=$disabled; folder=$false })
          }
        } finally { $key.Dispose() }
      }
    } finally { $base.Dispose() }
  }
}
foreach ($spec in @(@{ path=$startupFolder; source='User startup folder'; disabled=$false; manage=$true }, @{ path=$commonFolder; source='All users startup folder'; disabled=$false; manage=$false }, @{ path=$disabledFolder; source='User startup folder'; disabled=$true; manage=$true })) {
  if (-not [IO.Directory]::Exists($spec.path)) { continue }
  foreach ($file in [IO.Directory]::GetFiles($spec.path)) {
    $info = [IO.FileInfo]::new($file)
    if ($info.Name -eq 'desktop.ini') { continue }
    $linked = (($info.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)
    $rows.Add(@{ name=$info.Name; command=(Join-Path $(if ($spec.source -eq 'User startup folder') { $startupFolder } else { $commonFolder }) $info.Name); source=$spec.source; enabled=(-not $spec.disabled); manageable=($spec.manage -and -not $linked); disabled=$spec.disabled; folder=$true; stamp=$info.LastWriteTimeUtc.Ticks.ToString(); length=$info.Length })
  }
}
if ($request.action -eq 'toggle') {
  $entry = @($rows | Where-Object { $_.source -eq $request.source -and $_.name -ceq $request.name })
  if ($entry.Count -ne 1) { throw 'Entry changed or has conflicting backups. Refresh before changing it.' }
  $entry = $entry[0]
  if (-not $entry.manageable -or $entry.name -match 'devkithub' -or $entry.command -match '(^|[\\/\"])devkithub\.exe([\"\s]|$)') { throw 'Manage this entry in Windows or DevKitHub settings.' }
  if ($entry.command -cne $request.command -or $entry.enabled -ne $request.wasEnabled) { throw 'Entry changed since it was selected. Refresh and try again.' }
  if ($entry.enabled -eq $request.enabled) { throw 'Entry already has the requested state.' }
  if ($entry.folder) {
    function Assert-NoLinks([string]$target) {
      $current = [IO.DirectoryInfo]::new($target)
      while ($null -ne $current) {
        if ($current.Exists -and ($current.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Linked startup folders are not supported.' }
        $current = $current.Parent
      }
    }
    Assert-NoLinks $startupFolder
    Assert-NoLinks $disabledFolder
    $from = Join-Path $(if ($entry.enabled) { $startupFolder } else { $disabledFolder }) $entry.name
    $to = Join-Path $(if ($entry.enabled) { $disabledFolder } else { $startupFolder }) $entry.name
    if ($entry.stamp -ne $request.stamp -or $entry.length -ne $request.length) { throw 'Startup file changed. Refresh and try again.' }
    [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($to))
    [IO.File]::Move($from, $to)
  } else {
    $view = ($entry.source -split '/')[1]
    $base = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::CurrentUser, [Microsoft.Win32.RegistryView]::$view)
    $from = $null; $to = $null
    try {
      $from = $base.OpenSubKey($(if ($entry.enabled) { $runPath } else { $backupPath }), $true)
      $to = $base.CreateSubKey($(if ($entry.enabled) { $backupPath } else { $runPath }))
      if ($null -eq $from -or $from.GetValueNames() -notcontains $entry.name) { throw 'Startup entry no longer exists.' }
      if ($to.GetValueNames() -contains $entry.name) { throw 'A conflicting entry exists. Nothing was overwritten.' }
      $value = $from.GetValue($entry.name, '', $raw)
      $kind = $from.GetValueKind($entry.name)
      if ($value -cne $entry.command -or $kind.ToString() -ne $entry.kind) { throw 'Startup entry changed. Refresh and try again.' }
      $to.SetValue($entry.name, $value, $kind)
      $to.Flush()
      try { $from.DeleteValue($entry.name); $from.Flush() }
      catch { $to.DeleteValue($entry.name); throw }
    } finally { if ($from) { $from.Dispose() }; if ($to) { $to.Dispose() }; $base.Dispose() }
  }
  ConvertTo-Json -InputObject @{ ok=$true } -Compress
} else {
  ConvertTo-Json -InputObject @($rows.ToArray()) -Depth 4 -Compress
}
`;

interface NativeEntry extends StartupEntry {
  stamp?: string;
  length?: number;
  kind?: string;
  folder?: boolean;
}
export async function listStartup(): Promise<NativeEntry[]> {
  const rows = await runPowerShell<NativeEntry[]>(STARTUP_SCRIPT, {
    action: "list",
  });
  // Some Windows versions share the HKCU Run key between registry views.
  const seen = new Set<string>();
  return rows
    .filter((row) => {
      const key = `${row.source.replace(/Registry(32|64)/, "Registry")}|${row.name}|${row.command}|${row.enabled}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((row) => {
      const self =
        /devkithub/i.test(row.name) ||
        /(^|[\\/"])devkithub\.exe(["\s]|$)/i.test(row.command);
      return {
        ...row,
        id: JSON.stringify([row.source, row.name, row.enabled]),
        manageable: row.manageable && !self,
        reason: self
          ? "Manage DevKitHub in Settings & Profile."
          : !row.manageable
            ? "Manage this entry in Windows settings."
            : undefined,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function toggleStartup(
  entry: NativeEntry,
  enabled: boolean,
): Promise<void> {
  if (!entry.manageable) throw new Error("This entry is managed by Windows.");
  await runPowerShell(STARTUP_SCRIPT, {
    ...entry,
    action: "toggle",
    wasEnabled: entry.enabled,
    enabled,
  });
}

export async function windowsDrives(): Promise<SystemOverview["drives"]> {
  return runPowerShell(DRIVE_SCRIPT);
}
