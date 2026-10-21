# PC Maintenance

Desktop maintenance lives at `/pc-maintenance`, with direct links using
`?tab=disk`, `?tab=cleanup` and `?tab=startup`. The home catalog and sidebar
include a PC Maintenance category. All processing is local.

## First release

- **Overview:** Windows local drive capacity, memory, and summaries from this
  page's most recent cleanup/startup scans. Unscanned values are labelled as such.
- **Disk Space Analyzer:** a native folder picker, recursive logical file sizes,
  up to 500 immediate children and 100 largest files, filtering, sorting and
  revealing results in Explorer. Works beyond Windows as well.
- **Temporary File Cleaner:** Windows user and system Temp folders only. Files
  last modified within seven days, hard links, junctions and symbolic links are
  excluded. Users explicitly select categories after reviewing a sample of up to
  100 files per category and their complete counts/sizes.
- **Startup Manager:** inventories 32/64-bit Run keys and personal/common Startup
  folders. Personal entries can be disabled and restored. Machine-wide entries
  and DevKitHub's own registration are read-only. DevKitHub is managed through
  its existing profile settings.

Scans are asynchronous, have progress/cancellation, and stop at 200,000 entries.
Stopped/limited disk scans are labelled partial. Cancelled cleanup scans cannot
be used to delete files. Limited cleanup scans can clean only their scanned
candidates. Browser caches, registry cleaning, services, RunOnce, scheduled tasks,
Store startup tasks, duplicates and uninstallers are outside this release.

## File operations

The main process keeps cleanup snapshots; the renderer submits a snapshot ID
and category IDs, never deletion paths. Snapshots expire after 30 minutes and are
consumed after a confirmed cleanup. A native dialog defaults to Cancel and
explains permanent deletion. Every candidate is rechecked for containment,
linked path components, identity, size, timestamps and age. Changed/locked or
inaccessible files are skipped and reported. Only individual files are unlinked;
directories are never recursively removed. The report counts logical bytes of
deleted files, not a guaranteed increase in physical free space.

These are filesystem checks, not an atomic filesystem transaction. The app runs
with the user's normal permissions and does not request elevation. Windows Temp
may be partially or completely unavailable under those permissions.

## Startup operations

PowerShell receives a constant encoded script and data through JSON stdin, with
a 30-second timeout. It never executes startup commands. Before changing a
registration it re-reads the source and checks the selected state and command.

Disabled Run values are moved to
`HKCU\Software\DevKitHub\Maintenance\DisabledRun` in the corresponding registry
view. The original value type and unexpanded command are retained. A destination
conflict is refused rather than overwritten. A failed source removal rolls back
the new destination value. Personal Startup files move to
`%APPDATA%\DevKitHub\Maintenance\DisabledStartup` and are restored to their
original Startup folder. These backups survive app restarts; restore wanted
entries before manually removing the backups or uninstalling the app.

“Registered” means a Run value or Startup file exists. Windows Startup settings
can independently block it. The UI explains this and links to those settings;
this feature does not edit the undocumented StartupApproved binary format.

Only calls from the main window's main frame at the trusted app URL are accepted. A single maintenance
operation runs at a time. Unmounting the page, destroying the window or reloading
it aborts filesystem work. No scans or mutations run on a schedule.

## Verification

```powershell
npx vitest run src/tests/main/maintenance-files.test.ts src/tests/main/maintenance-windows.test.ts src/tests/main/maintenance-ipc.test.ts src/tests/pages/pc-maintenance.test.tsx
node scripts/verify-maintenance.cjs
```

The Windows tests use private, randomly named fixture registry keys and folders,
including disable/restore round trips for Unicode names, expandable commands and
startup files. They never modify real startup registrations.

The Electron check builds an isolated harness using the real page, the production
preload bridge and real IPC implementation. It analyzes fixture files, reads the
Windows startup inventory, verifies the light/dark/narrow layouts, and writes
screenshots to ignored `out/maintenance-qa`. Native mutation confirmations are
always cancelled in this harness. It does not package or publish the application.
