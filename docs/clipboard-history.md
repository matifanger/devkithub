# Clipboard History

DevKitHub monitors the operating-system clipboard in the Electron main process and stores a searchable local history. The feature supports plain text, URLs, code, images, and copied file paths. Rich text copied from other applications is restored as plain text.

## Quick window

- Default shortcut: `CommandOrControl+Shift+H`
- In Settings, focus the shortcut field and press a key combination to capture its Electron accelerator value.
- The shortcut creates one dedicated `BrowserWindow` at `#/clipboard-quick` with the same complete manager shown in the main application.
- Pressing the shortcut again toggles that same window instead of creating duplicates.
- Arrow keys select items, `Enter` restores the selected item to the system clipboard, and `Escape` hides the window.
- Every row has a one-click copy action; double-clicking the row also copies it.

## Retention and privacy

History is stored under Electron's `userData/clipboard-history/history.dat`. The file is protected with Electron `safeStorage` when OS encryption is available. No clipboard content is sent to a server.

Content marked as secret by password managers is stored by default and expires after three days. Both behaviors are configurable:

- Disable **Store content marked as secret** to ignore future secret clipboard values.
- Set **Secret retention in days** to choose how long marked values live. `0` keeps them indefinitely.
- Set a default retention for ordinary items, per-item expiration, maximum item size, total history size, and maximum item count.
- Expired items are deleted; no placeholder containing their old value remains.

## Content rules

Rules apply to newly copied content. A rule can use a case-sensitive or case-insensitive plain-text match, or a regular expression. Supported actions are:

- **Do not store**: discard matching copies immediately.
- **Store, then expire**: retain matching content for a configured number of minutes, hours, or days.

If several expiration rules match, the shortest lifetime wins. Any matching **Do not store** rule takes precedence.

## Main-process architecture

- `src/main/clipboard/history-service.ts`: capture, encryption, persistence, retention, deduplication, and clipboard restoration.
- `src/main/clipboard/history-controller.ts`: IPC, global shortcut, quick window, and navigation into other DevKitHub tools.
- `src/services/clipboard/history-policy.ts`: pure classification, rule evaluation, and history-limiting functions.
- `src/components/clipboard/history-view.tsx`: the shared full React experience used by both windows.
- `src/types/clipboard-history.ts`: shared IPC contracts.
