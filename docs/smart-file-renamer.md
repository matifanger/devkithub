# Smart File Renamer

Independent DevKitHub implementation inspired by NameQuick's content-based file workflow. Research checked on 2026-09-19 against the official sources below.

## Implemented workflow

- File/folder import and drag-and-drop; optional recursive traversal; 1,000-item persistent library.
- Metadata-only names and local AI using Ollama or an LM Studio compatible HTTP endpoint on loopback.
- Presets with template placeholders, custom extraction fields, natural-language extraction instructions, letter case and word separators.
- PDF text, scanned-PDF rendering for vision, raster images, Office/OpenDocument/EPUB and common UTF-8 text/code files.
- Editable previews, per-file errors, explicit apply confirmation, preserved extensions and timestamps, destination collision checks.
- Ordered organization rules matching extension, filename, extracted content, type or vendor; destinations stay under the current source folder.
- Persistent watched folders, stable-file polling every five seconds, review mode by default and opt-in automatic application of complete/high-confidence results.
- Extracted-content search, SHA-256 exact duplicates, library/history CSV export.
- Durable operation journal, interrupted-operation reconciliation, hash-checked undo and cancellation between files / during model requests.

## Setup

Open Smart File Renamer. Without a model, select **Dated archive**, save settings, add files and analyze. For content naming, run Ollama or LM Studio locally, choose the provider, save the endpoint, test the connection, choose an installed model and save again. Images and scanned PDFs need an image-capable model. DevKitHub does not install/start models.

Endpoints: `http://127.0.0.1:11434` for Ollama, `http://127.0.0.1:1234/v1` for LM Studio. Remote endpoints, credentials in URLs and redirects are rejected. Extracted text and image data go only to the configured loopback service; that service's own behavior is controlled by its operator.

## Scope and limits

This is not the proprietary NameQuick application or a connection to its paid service. NameQuick managed subscriptions, email account/inbox integration, Finder tags/comments, global quick-rename shortcut, visual similarity search, conditional/computed template fields and extraction-sheet UI are not implemented. CSV exports cover the extracted fields available in this implementation.

Content extraction is bounded to 40 MB per file, 24,000 text characters, 10 PDF pages, 3 scanned PDF images, 5 spreadsheet sheets and 200 rows per sheet. Partial extraction always requires review. Password-protected or unsupported content reports an error; a metadata template or manual preview can still name the file. Legacy binary Word/PowerPoint and Apple Pages are not advertised as readable.

Watch folders run while the app is open, including in its tray. Initial existing files are skipped. Replaced/changed files can be processed again after stability checks. Hard-link-based moves preserve file data and timestamps and fail safely on filesystems without hard-link support. Case-only renames on case-insensitive filesystems are rejected as occupied destinations. No duplicate removal is performed.

The durable library is stored at `<userData>/smart-file-renamer.json`; file paths, extracted text, settings, watch state and history are local data. The UI's view/edit preferences use the existing `useToolState` persistence. Clearing the library removes its text index without deleting files or the undo journal. Do not delete a damaged journal to hide an initialization error; preserve it for recovery.

## Validation

`npx vitest run src/tests/main/smart-file-renamer.test.ts src/tests/main/renamer-extraction.test.ts src/tests/pages/smart-file-renamer.test.tsx`

`node scripts/verify-renamer.cjs` bundles the actual controller, preload and page into `out/renamer-verification`, then exercises them in hidden Electron with a separate profile and fixture files. It verifies scanned-PDF rendering through a fixture local model endpoint, import, analyze, apply, undo, duplicates, tabs and narrow-window layout. The fixture endpoint verifies protocol handling, not inference quality from an actual installed model.

## Sources

- [NameQuick overview](https://www.namequick.app/)
- [Naming presets](https://www.namequick.app/docs/presets)
- [Organization rules](https://www.namequick.app/docs/rules)
- [Supported formats](https://www.namequick.app/docs/supported-formats)
- [Undo and history](https://www.namequick.app/docs/undo-history)
- [Ollama chat API](https://docs.ollama.com/api/chat)
- [LM Studio chat completions](https://lmstudio.ai/docs/developer/openai-compat/chat-completions)
