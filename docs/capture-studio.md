# DevKitHub Capture Toolkit

The desktop app now includes four connected tools: Screenshot Studio, Screen Recorder, Video Editor and Capture Library. Their routes, media-category entries, metadata, preload bridge and main-process handlers are registered. The website catalog and generated tool pages are included in the sibling `frontend` project.

## Use the tools

- **Screenshot Studio:** select a display/window or import, drop or paste a PNG/JPEG/WebP image. Draw arrows, rectangles, ellipses, highlights, opaque redactions, freehand strokes, text or numbered steps. Drag in Crop mode to keep a region. Undo/redo works for marks and crops. Add a gradient, solid color, dots, grid or local background photo; adjust padding, corners, shadow, browser frame, aspect ratio, alignment and signature. Save style presets. Export PNG/JPEG/WebP at 0.5×–3×, copy a PNG, save to the library or pin above other windows.
- **Screen Recorder:** explicitly choose a display/window; optionally provide a crop in source pixels. Configure 15/30/60 FPS, bitrate, countdown, microphone, Windows system audio and webcam. The webcam is composited into a circular bubble. Pause excludes paused time. Switching routes or minimizing the main window does not terminate recording. Stop saves the WebM to disk.
- **Video Editor:** import MP4/WebM/MOV or open a library recording. Set trim points numerically or at the playhead, step frames, adjust speed (0.5×–2×), volume/mute, background/padding and one smoothly eased zoom segment with a chosen focus. Extract a still into Screenshot Studio. Export real MP4/H.264, WebM/VP9 or animated GIF with progress and cancellation. Original files remain unchanged.
- **Capture Library:** search/filter, preview, rename, download, copy or pin images, open editors, and delete selected local files. Cloud sharing is explicit and optional.

Shortcuts: `Ctrl/Command+Shift+2` opens Screenshot Studio; `Ctrl/Command+Shift+R` opens the recorder or stops an active recording; `Ctrl/Command+Shift+P` pauses/resumes. The OS can reserve a shortcut; registration failure is logged. Start recording from the source-selection screen. Global shortcuts are unregistered on quit.

## Data and recovery

Media lives in `<Electron userData>/captures`, with UUID file names and individual metadata files. Preferences and style presets use the existing `useToolState` mechanism. Image export limits are 8192 px per side and 40 megapixels; image import accepts up to 32 megapixels. Cloud uploads have a 50 MB limit.

Recording chunks are written sequentially to `.partial` files, never accumulated indefinitely in renderer memory. Backpressure stops a recording if the disk cannot keep up. On restart, nonempty interrupted files are recovered into the library. Recoverability depends on how much of the WebM reached disk. FFmpeg scans timestamps for imports/recovered WebM files without duration headers.

Only flattened images are stored by Screenshot Studio; their redacted pixels are replaced. Editing a library image starts from that flattened export. Unsaved annotations and original image layers are session-only; saved style presets do not contain screenshot pixels. Video trim/zoom selections are session-only; export preferences persist. Camera and audio are composited/mixed during recording and are not independently editable tracks.

## Capture Cloud setup

The server is part of `frontend`, using NuxtHub private blob storage. It is an **owner-operated sharing service**, not a multi-tenant SaaS account system. One server upload token authorizes uploads and deletion of any capture on that server. Do not distribute it as a public client credential.

1. Set `NUXT_CAPTURE_UPLOAD_TOKEN` to a cryptographically random value of at least 32 characters on the server. For example, generate one locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`; store it as a deployment secret.
2. In production, provision a private Cloudflare R2 bucket. Set `NUXT_CAPTURE_BUCKET` (default `devkithub-captures`) before building. NuxtHub configures the `BLOB` binding. Keep public bucket access disabled.
3. Deploy the existing frontend/server through the project's normal Cloudflare deployment process. No production service was provisioned or deployed by this implementation.
4. In Capture Library → Capture Cloud, enter the HTTPS origin and upload token. Local development also accepts HTTP on `localhost`/`127.0.0.1`. Tokens are stored using the existing OS credential vault integration (`keytar`), not in renderer settings.
5. Choose a capture, click Share, select 1/7/30 days, optionally set a password, then explicitly upload. Copy the resulting link. Revoke deletes its cloud object. Deleting a local capture does not revoke an existing cloud link.

The public viewer is `/capture/:id`. Protected viewers receive short-lived HttpOnly cookies signed for that capture and expiry. Every metadata/media request checks expiry; responses disable caching and indexing. Media supports byte ranges for video seeking. Passwords are salted and hashed. Uploads require a bearer token, allowed MIME type and matching file signature. Rate limiting uses the project's existing in-process limiter; production deployments requiring distributed abuse protection should configure their edge rate limits.

Expired links immediately become inaccessible. Expiry does not itself run background object deletion. Configure an R2 lifecycle rule for the `captures/` prefix to delete objects after 31 days, or revoke links to remove objects immediately. Revocation cannot remove files a recipient already downloaded. Hosting/storage costs and account-level access controls are outside the local desktop tools.

## Repeatable verification

From `electron-app`:

```powershell
npx tsc --noEmit --pretty false
npx vitest run src/tests/main/capture-library.test.ts src/tests/services/capture-media.test.ts src/tests/pages/capture-tools.test.tsx
node scripts/build-capture-smoke.cjs
node scripts/capture-smoke.cjs
npm run package
```

The Electron smoke test uses a temporary profile and its own synthetic window, with test microphone/webcam devices. It checks actual canvas pixels after redaction, saved images, the clipboard bridge without changing the user's clipboard, re-editing, media playback, recording/pause/navigation, all three FFmpeg encoders, export cancellation, frame extraction, download, deletion and restart persistence. It does not record the user's screen or real microphone. Screenshots are written to `test-results/capture/`. Generated test bundles are ignored by Git.

From `frontend`, start a local server with a test token and run the API test in a second terminal:

```powershell
$env:NUXT_CAPTURE_UPLOAD_TOKEN='capture-smoke-local-token-not-for-production-2026'
$env:NUXT_SESSION_PASSWORD='capture-smoke-session-password-not-for-production-2026'
npx nuxt dev --port 4017 --host 127.0.0.1
# Second terminal:
node scripts/capture-cloud-smoke.mjs
```

The cloud test is restricted to localhost and tests authentication, MIME rejection, password checks, tamper resistance, media bytes, byte ranges, the public viewer, expiry and revocation. Its expiry fixture modifies only the object it just uploaded to the development filesystem driver.

## Research and scope

Functional references, implemented independently using the application's own components:

- [Pretty Snap](https://prettysnap.app/) — screenshot backgrounds, composition and easy export.
- [CleanShot screenshots](https://cleanshot.com/screenshots) — markup, redaction, framing and capture workflow.
- [CleanShot recording](https://cleanshot.com/screen-recording) and [Cloud](https://cleanshot.com/product/cloud) — recording, library and explicit sharing.
- [ScreenSage recording](https://guide.screensage.pro/docs/recording), [editing](https://guide.screensage.pro/docs/editing) and [effects](https://guide.screensage.pro/docs/effects) — region/webcam capture, time controls and attention-guiding zooms.

This is not feature-for-feature parity with these native products. Automatic scrolling capture, on-device OCR, global click/keystroke capture, automatic cursor following, editable camera/audio tracks, multi-clip editing, 3D motion, team comments, SSO and transcription are not implemented. macOS/Linux device permissions, system-audio support and packaged capture need validation on those platforms; the real-media verification was performed on Windows.
