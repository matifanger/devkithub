import axios from "axios";
import React, { useEffect } from "react";
import * as ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Toaster } from "./components/ui/toaster";
import { UpgradeModal } from "./components/upgrade-modal";
import {
  LAUNCH_ON_STARTUP_KEY,
  REJECTED_VERSION_KEY,
  UPDATE_PREFERENCE_KEY,
} from "./constants/settings-keys";
import { AuthProvider } from "./contexts/auth-context";
import { UpgradeModalProvider } from "./contexts/upgrade-modal-context";
import { AutosaveSettingsProvider } from "./contexts/autosave-settings-context";
import { ClipboardSettingsProvider } from "./contexts/clipboard-settings-context";
import { EditorSettingsProvider } from "./contexts/editor-settings-context";
import { useToast } from "./hooks/use-toast";
import { AppLayout } from "./layouts/app-layout";
import { MainPage } from "./pages/index";
import { CaptureSessionControls } from './components/capture/session-controls';
const ScreenshotStudioPage = React.lazy(() => import('./pages/screenshot-studio').then(m => ({ default: m.ScreenshotStudioPage })));
const ScreenRecorderPage = React.lazy(() => import('./pages/screen-recorder').then(m => ({ default: m.ScreenRecorderPage })));
const VideoEditorPage = React.lazy(() => import('./pages/video-editor').then(m => ({ default: m.VideoEditorPage })));
const CaptureLibraryPage = React.lazy(() => import('./pages/capture-library').then(m => ({ default: m.CaptureLibraryPage })));
import { ThemeProvider } from "./providers/theme-provider";
import { isNewerVersion } from "./utils/profile/update-utils";

// Keep the home screen small; tool code loads only when its route is opened.
const PcMaintenancePage = React.lazy(() =>
  import("./pages/pc-maintenance").then(module => ({ default: module.PcMaintenancePage })),
);
const SmartFileRenamerPage = React.lazy(() => import("./pages/smart-file-renamer").then((module) => ({ default: module.SmartFileRenamerPage })));
const AsciiToHexPage = React.lazy(() =>
  import("./pages/ascii-to-hex").then((module) => ({
    default: module.AsciiToHexPage,
  })),
);
const BackslashEscapeUnescapePage = React.lazy(() =>
  import("./pages/backslash-escape-unescape").then((module) => ({
    default: module.BackslashEscapeUnescapePage,
  })),
);
const Base64ImageEncoderDecoderPage = React.lazy(() =>
  import("./pages/base64-image-encoder-decoder").then((module) => ({
    default: module.Base64ImageEncoderDecoderPage,
  })),
);
const Base64StringEncoderDecoderPage = React.lazy(() =>
  import("./pages/base64-string-encoder-decoder").then((module) => ({
    default: module.Base64StringEncoderDecoderPage,
  })),
);
const CertificateDecoderPage = React.lazy(() =>
  import("./pages/certificate-decoder").then((module) => ({
    default: module.CertificateDecoderPage,
  })),
);
const CharacterWordCounterPage = React.lazy(() =>
  import("./pages/character-word-counter").then((module) => ({
    default: module.CharacterWordCounterPage,
  })),
);
const ColorConverterPage = React.lazy(() =>
  import("./pages/color-converter").then((module) => ({
    default: module.ColorConverterPage,
  })),
);
const CronJobParserPage = React.lazy(() =>
  import("./pages/cron-job-parser").then((module) => ({
    default: module.CronJobParserPage,
  })),
);
const CssBeautifyPage = React.lazy(() =>
  import("./pages/css-beautify").then((module) => ({
    default: module.CssBeautifyPage,
  })),
);
const CssToSvgPage = React.lazy(() =>
  import("./pages/css-to-svg").then((module) => ({
    default: module.CssToSvgPage,
  })),
);
const CsvToJsonPage = React.lazy(() =>
  import("./pages/csv-to-json").then((module) => ({
    default: module.CsvToJsonPage,
  })),
);
const CsvTsvConverterPage = React.lazy(() =>
  import("./pages/csv-tsv-converter").then((module) => ({
    default: module.CsvTsvConverterPage,
  })),
);
const CurlToCodePage = React.lazy(() =>
  import("./pages/curl-to-code").then((module) => ({
    default: module.CurlToCodePage,
  })),
);
const DiscordTimestampPage = React.lazy(() =>
  import("./pages/discord-timestamp").then((module) => ({
    default: module.DiscordTimestampPage,
  })),
);
const DummyDataGeneratorPage = React.lazy(() =>
  import("./pages/dummy-data-generator").then((module) => ({
    default: module.DummyDataGeneratorPage,
  })),
);
const EncodeDecodePage = React.lazy(() =>
  import("./pages/encode-decode").then((module) => ({
    default: module.EncodeDecodePage,
  })),
);
const ExcelConverterPage = React.lazy(() =>
  import("./pages/excel-converter").then((module) => ({
    default: module.ExcelConverterPage,
  })),
);
const ErbBeautifyPage = React.lazy(() =>
  import("./pages/erb-beautify").then((module) => ({
    default: module.ErbBeautifyPage,
  })),
);
const HexToAsciiPage = React.lazy(() =>
  import("./pages/hex-to-ascii").then((module) => ({
    default: module.HexToAsciiPage,
  })),
);
const HtmlBeautifyPage = React.lazy(() =>
  import("./pages/html-beautify").then((module) => ({
    default: module.HtmlBeautifyPage,
  })),
);
const HtmlEntityEncoderDecoderPage = React.lazy(() =>
  import("./pages/html-entity-encoder-decoder").then((module) => ({
    default: module.HtmlEntityEncoderDecoderPage,
  })),
);
const HtmlPreviewPage = React.lazy(() =>
  import("./pages/html-preview").then((module) => ({
    default: module.HtmlPreviewPage,
  })),
);
const HtmlToJsxPage = React.lazy(() =>
  import("./pages/html-to-jsx").then((module) => ({
    default: module.HtmlToJsxPage,
  })),
);
const ImageOptimizerPage = React.lazy(() =>
  import("./pages/image-optimizer").then((module) => ({
    default: module.ImageOptimizerPage,
  })),
);
const IniParserPage = React.lazy(() =>
  import("./pages/ini-parser").then((module) => ({
    default: module.IniParserPage,
  })),
);
const CodeCommentsRemoverPage = React.lazy(() =>
  import("./pages/code-comments-remover").then((module) => ({
    default: module.CodeCommentsRemoverPage,
  })),
);
const JsBeautifyPage = React.lazy(() =>
  import("./pages/js-beautify").then((module) => ({
    default: module.JsBeautifyPage,
  })),
);
const JsObfuscatorPage = React.lazy(() =>
  import("./pages/js-obfuscator").then((module) => ({
    default: module.JsObfuscatorPage,
  })),
);
const UuidValidatorPage = React.lazy(() =>
  import("./pages/uuid-validator").then((module) => ({
    default: module.UuidValidatorPage,
  })),
);
const IpValidatorPage = React.lazy(() =>
  import("./pages/ip-validator").then((module) => ({
    default: module.IpValidatorPage,
  })),
);
const HttpStatusCodesPage = React.lazy(() =>
  import("./pages/http-status-codes").then((module) => ({
    default: module.HttpStatusCodesPage,
  })),
);
const MimeTypesReferencePage = React.lazy(() =>
  import("./pages/mime-types-reference").then((module) => ({
    default: module.MimeTypesReferencePage,
  })),
);
const RestApiTesterPage = React.lazy(() =>
  import("./pages/rest-api-tester").then((module) => ({
    default: module.RestApiTesterPage,
  })),
);
const JsonFormatPage = React.lazy(() =>
  import("./pages/json-format").then((module) => ({
    default: module.JsonFormatPage,
  })),
);
const JsonToCodePage = React.lazy(() =>
  import("./pages/json-to-code").then((module) => ({
    default: module.JsonToCodePage,
  })),
);
const JsonToCsvPage = React.lazy(() =>
  import("./pages/json-to-csv").then((module) => ({
    default: module.JsonToCsvPage,
  })),
);
const JsonToPhpPage = React.lazy(() =>
  import("./pages/json-to-php").then((module) => ({
    default: module.JsonToPhpPage,
  })),
);
const JsonToYamlPage = React.lazy(() =>
  import("./pages/json-to-yaml").then((module) => ({
    default: module.JsonToYamlPage,
  })),
);
const JsonSchemaValidatorPage = React.lazy(() =>
  import("./pages/json-schema-validator").then((module) => ({
    default: module.JsonSchemaValidatorPage,
  })),
);
const JwtDebuggerPage = React.lazy(() =>
  import("./pages/jwt-debug").then((module) => ({
    default: module.JwtDebuggerPage,
  })),
);
const JwtBuilderPage = React.lazy(() =>
  import("./pages/jwt-builder").then((module) => ({
    default: module.JwtBuilderPage,
  })),
);
const LessBeautifyPage = React.lazy(() =>
  import("./pages/less-beautify").then((module) => ({
    default: module.LessBeautifyPage,
  })),
);
const LineSortDedupePage = React.lazy(() =>
  import("./pages/line-sort-dedupe").then((module) => ({
    default: module.LineSortDedupePage,
  })),
);
const LoremIpsumGeneratorPage = React.lazy(() =>
  import("./pages/lorem-ipsum-generator").then((module) => ({
    default: module.LoremIpsumGeneratorPage,
  })),
);
const MarkdownPreviewPage = React.lazy(() =>
  import("./pages/markdown-preview").then((module) => ({
    default: module.MarkdownPreviewPage,
  })),
);
const NumberBaseConverterPage = React.lazy(() =>
  import("./pages/number-base-converter").then((module) => ({
    default: module.NumberBaseConverterPage,
  })),
);
const PhpDeserializerPage = React.lazy(() =>
  import("./pages/php-deserializer").then((module) => ({
    default: module.PhpDeserializerPage,
  })),
);
const PhpSerializerPage = React.lazy(() =>
  import("./pages/php-serializer").then((module) => ({
    default: module.PhpSerializerPage,
  })),
);
const PhpToJsonPage = React.lazy(() =>
  import("./pages/php-to-json").then((module) => ({
    default: module.PhpToJsonPage,
  })),
);
const PomodoroTimerPage = React.lazy(() =>
  import("./pages/pomodoro-timer").then((module) => ({
    default: module.PomodoroTimerPage,
  })),
);
const QRCodePage = React.lazy(() =>
  import("./pages/qr-code").then((module) => ({ default: module.QRCodePage })),
);
const RandomStringGeneratorPage = React.lazy(() =>
  import("./pages/random-string-generator").then((module) => ({
    default: module.RandomStringGeneratorPage,
  })),
);
const RegexTesterPage = React.lazy(() =>
  import("./pages/regex-tester").then((module) => ({
    default: module.RegexTesterPage,
  })),
);
const ScssBeautifyPage = React.lazy(() =>
  import("./pages/scss-beautify").then((module) => ({
    default: module.ScssBeautifyPage,
  })),
);
const SqlFormatterPage = React.lazy(() =>
  import("./pages/sql-formatter").then((module) => ({
    default: module.SqlFormatterPage,
  })),
);
const SqlJsonConverterPage = React.lazy(() =>
  import("./pages/sql-json-converter").then((module) => ({
    default: module.SqlJsonConverterPage,
  })),
);
const TypescriptToJsPage = React.lazy(() =>
  import("./pages/typescript-to-js").then((module) => ({
    default: module.TypescriptToJsPage,
  })),
);
const StringCaseConverterPage = React.lazy(() =>
  import("./pages/string-case-converter").then((module) => ({
    default: module.StringCaseConverterPage,
  })),
);
const SvgToCssPage = React.lazy(() =>
  import("./pages/svg-to-css").then((module) => ({
    default: module.SvgToCssPage,
  })),
);
const TextDiffCheckerPage = React.lazy(() =>
  import("./pages/text-diff-checker").then((module) => ({
    default: module.TextDiffCheckerPage,
  })),
);
const UnixTimePage = React.lazy(() =>
  import("./pages/unix-time").then((module) => ({
    default: module.UnixTimePage,
  })),
);
const UrlEncoderDecoderPage = React.lazy(() =>
  import("./pages/url-encoder-decoder").then((module) => ({
    default: module.UrlEncoderDecoderPage,
  })),
);
const UrlParserPage = React.lazy(() =>
  import("./pages/url-parser").then((module) => ({
    default: module.UrlParserPage,
  })),
);
const ValidateLicensePage = React.lazy(() =>
  import("./pages/validate-license").then((module) => ({
    default: module.ValidateLicensePage,
  })),
);
const XmlBeautifyPage = React.lazy(() =>
  import("./pages/xml-beautify").then((module) => ({
    default: module.XmlBeautifyPage,
  })),
);
const XmlJsonConverterPage = React.lazy(() =>
  import("./pages/xml-json-converter").then((module) => ({
    default: module.XmlJsonConverterPage,
  })),
);
const YamlToJsonPage = React.lazy(() =>
  import("./pages/yaml-to-json").then((module) => ({
    default: module.YamlToJsonPage,
  })),
);
const BMICalculatorPage = React.lazy(() =>
  import("./pages/bmi-calculator").then((module) => ({
    default: module.BMICalculatorPage,
  })),
);
const StopwatchPage = React.lazy(() =>
  import("./pages/stopwatch").then((module) => ({
    default: module.StopwatchPage,
  })),
);
const UnitConverterPage = React.lazy(() =>
  import("./pages/unit-converter").then((module) => ({
    default: module.UnitConverterPage,
  })),
);
const WorldClockPage = React.lazy(() =>
  import("./pages/world-clock").then((module) => ({
    default: module.WorldClockPage,
  })),
);
const TextStatisticsAnalyzerPage = React.lazy(() =>
  import("./pages/text-statistics-analyzer").then((module) => ({
    default: module.TextStatisticsAnalyzerPage,
  })),
);
const TomlParserPage = React.lazy(() =>
  import("./pages/toml-parser").then((module) => ({
    default: module.TomlParserPage,
  })),
);
const VoiceTranscriptionPage = React.lazy(() =>
  import("./pages/voice-transcription").then((module) => ({
    default: module.VoiceTranscriptionPage,
  })),
);
const CodeComparisonPage = React.lazy(() =>
  import("./pages/code-comparison").then((module) => ({
    default: module.CodeComparisonPage,
  })),
);
const KanbanPage = React.lazy(() =>
  import("./pages/kanban").then((module) => ({ default: module.KanbanPage })),
);
const PortKillPage = React.lazy(() =>
  import("./pages/port-kill").then((module) => ({
    default: module.PortKillPage,
  })),
);
const ClipboardHistoryPage = React.lazy(() =>
  import("./pages/clipboard-history").then((module) => ({
    default: module.ClipboardHistoryPage,
  })),
);
const ClipboardQuickPage = React.lazy(() =>
  import("./pages/clipboard-quick").then((module) => ({
    default: module.ClipboardQuickPage,
  })),
);

const App = () => {
  const { toast } = useToast();
  const [showCloseDialog, setShowCloseDialog] = React.useState(false);
  const [rememberChoice, setRememberChoice] = React.useState(false);
  const [isElectronReady, setIsElectronReady] = React.useState(false);

  // Check if window.electron is available
  React.useEffect(() => {
    if (window.electron) {
      setIsElectronReady(true);
    } else {
      console.warn(
        "window.electron not available - running in standalone mode",
      );
    }
  }, []);

  useEffect(() => {
    if (isElectronReady) {
      checkForUpdates();
    }
  }, [isElectronReady]);

  React.useEffect(() => {
    if (!window.electron) return;

    // Listen for main process request to show close dialog
    window.electron.onShowCloseDialog(() => {
      setShowCloseDialog(true);
    });
  }, []);

  const handleCloseSelection = async (action: "quit" | "tray") => {
    await window.electron.sendCloseDialogSelection(action, rememberChoice);
    setShowCloseDialog(false);
  };

  const checkForUpdates = async () => {
    try {
      // Check user preference for updates
      const updatesEnabled = await window.electron.settingsStore.get(
        UPDATE_PREFERENCE_KEY,
      );

      // Default to true if preference is not set
      const shouldCheckUpdates =
        updatesEnabled === null || updatesEnabled === "true";

      if (!shouldCheckUpdates) {
        console.log("Updates are disabled by user preference");
        return;
      }

      const response = await axios.get(
        "https://api.github.com/repos/matifanger/devkithub/releases/latest",
      );
      const latestVersion = response.data.tag_name.replace(/^v/, "");
      const currentVersion = await window.electron.env.get(
        "npm_package_version",
      );

      console.log("latestVersion", latestVersion);
      console.log("currentVersion", currentVersion);

      // Check if this version was already rejected
      const rejectedVersion =
        await window.electron.settingsStore.get(REJECTED_VERSION_KEY);
      if (rejectedVersion === latestVersion) {
        console.log("This version was already rejected by the user");
        return;
      }

      if (isNewerVersion(latestVersion, currentVersion)) {
        const updateToast = toast({
          title: "New version available!",
          description: `Version ${latestVersion} is now available. ${response.data.body || "Update for new features!"}`,
          duration: Infinity,
          action: (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  window.electron.openExternal(
                    "https://github.com/matifanger/devkithub/releases/latest",
                  )
                }
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive"
              >
                Download
              </button>
            </div>
          ),
        });
      }
    } catch (err) {
      console.error("Error checking version:", err);
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <UpgradeModalProvider>
          <ClipboardSettingsProvider>
            <AutosaveSettingsProvider>
              <EditorSettingsProvider>
                <HashRouter>
                  <UpgradeModal />
                  <React.Suspense
                    fallback={
                      <div
                        role="status"
                        className="p-6 text-sm text-muted-foreground"
                      >
                        Loading tool…
                      </div>
                    }
                  >
                    <Routes>
                      <Route
                        path="/validate-license"
                        element={<ValidateLicensePage />}
                      />
                      <Route
                        path="/clipboard-quick"
                        element={<ClipboardQuickPage />}
                      />
                      <Route element={<AppLayout />}>
                        <Route path="/" element={<MainPage />} />
                        <Route path="/pc-maintenance" element={<PcMaintenancePage />} />
                        <Route
                          path="/encode-decode"
                          element={<EncodeDecodePage />}
                        />
                        <Route
                          path="/excel-converter"
                          element={<ExcelConverterPage />}
                        />
                        <Route
                          path="/hash-generator"
                          element={<EncodeDecodePage />}
                        />
                        <Route
                          path="/number-base-converter"
                          element={<NumberBaseConverterPage />}
                        />
                        <Route
                          path="/yaml-to-json"
                          element={<YamlToJsonPage />}
                        />
                        <Route
                          path="/json-to-yaml"
                          element={<JsonToYamlPage />}
                        />
                        <Route
                          path="/json-format"
                          element={<JsonFormatPage />}
                        />
                        <Route
                          path="/json-schema-validator"
                          element={<JsonSchemaValidatorPage />}
                        />
                        <Route
                          path="/json-to-code"
                          element={<JsonToCodePage />}
                        />
                        <Route
                          path="/curl-to-code"
                          element={<CurlToCodePage />}
                        />
                        <Route path="/unix-time" element={<UnixTimePage />} />
                        <Route
                          path="/jwt-debug"
                          element={<JwtDebuggerPage />}
                        />
                        <Route
                          path="/jwt-builder"
                          element={<JwtBuilderPage />}
                        />
                        <Route
                          path="/cron-job-parser"
                          element={<CronJobParserPage />}
                        />
                        <Route
                          path="/color-converter"
                          element={<ColorConverterPage />}
                        />
                        <Route
                          path="/base64-string-encoder-decoder"
                          element={<Base64StringEncoderDecoderPage />}
                        />
                        <Route
                          path="/base64-image-encoder-decoder"
                          element={<Base64ImageEncoderDecoderPage />}
                        />
                        <Route
                          path="/regex-tester"
                          element={<RegexTesterPage />}
                        />
                        <Route
                          path="/url-encoder-decoder"
                          element={<UrlEncoderDecoderPage />}
                        />
                        <Route
                          path="/html-entity-encoder-decoder"
                          element={<HtmlEntityEncoderDecoderPage />}
                        />
                        <Route
                          path="/backslash-escape-unescape"
                          element={<BackslashEscapeUnescapePage />}
                        />
                        <Route
                          path="/code-comments-remover"
                          element={<CodeCommentsRemoverPage />}
                        />
                        <Route
                          path="/html-beautify"
                          element={<HtmlBeautifyPage />}
                        />
                        <Route
                          path="/css-beautify"
                          element={<CssBeautifyPage />}
                        />
                        <Route
                          path="/js-beautify"
                          element={<JsBeautifyPage />}
                        />
                        <Route
                          path="/js-obfuscator"
                          element={<JsObfuscatorPage />}
                        />
                        <Route
                          path="/uuid-validator"
                          element={<UuidValidatorPage />}
                        />
                        <Route
                          path="/ip-validator"
                          element={<IpValidatorPage />}
                        />
                        <Route
                          path="/http-status-codes"
                          element={<HttpStatusCodesPage />}
                        />
                        <Route
                          path="/mime-types-reference"
                          element={<MimeTypesReferencePage />}
                        />
                        <Route
                          path="/rest-api-tester"
                          element={<RestApiTesterPage />}
                        />
                        <Route
                          path="/xml-beautify"
                          element={<XmlBeautifyPage />}
                        />
                        <Route
                          path="/xml-json-converter"
                          element={<XmlJsonConverterPage />}
                        />
                        <Route
                          path="/less-beautify"
                          element={<LessBeautifyPage />}
                        />
                        <Route
                          path="/scss-beautify"
                          element={<ScssBeautifyPage />}
                        />
                        <Route
                          path="/erb-beautify"
                          element={<ErbBeautifyPage />}
                        />
                        <Route
                          path="/sql-formatter"
                          element={<SqlFormatterPage />}
                        />
                        <Route
                          path="/sql-json-converter"
                          element={<SqlJsonConverterPage />}
                        />
                        <Route
                          path="/typescript-to-js"
                          element={<TypescriptToJsPage />}
                        />
                        <Route
                          path="/line-sort-dedupe"
                          element={<LineSortDedupePage />}
                        />
                        <Route
                          path="/hex-to-ascii"
                          element={<HexToAsciiPage />}
                        />
                        <Route
                          path="/ascii-to-hex"
                          element={<AsciiToHexPage />}
                        />
                        <Route
                          path="/html-preview"
                          element={<HtmlPreviewPage />}
                        />
                        <Route
                          path="/markdown-preview"
                          element={<MarkdownPreviewPage />}
                        />
                        <Route
                          path="/html-to-jsx"
                          element={<HtmlToJsxPage />}
                        />
                        <Route
                          path="/json-to-csv"
                          element={<JsonToCsvPage />}
                        />
                        <Route
                          path="/csv-to-json"
                          element={<CsvToJsonPage />}
                        />
                        <Route
                          path="/csv-tsv-converter"
                          element={<CsvTsvConverterPage />}
                        />
                        <Route
                          path="/string-case-converter"
                          element={<StringCaseConverterPage />}
                        />
                        <Route
                          path="/random-string-generator"
                          element={<RandomStringGeneratorPage />}
                        />
                        <Route
                          path="/dummy-data-generator"
                          element={<DummyDataGeneratorPage />}
                        />
                        <Route path="/qr-code" element={<QRCodePage />} />
                        <Route
                          path="/php-serializer"
                          element={<PhpSerializerPage />}
                        />
                        <Route
                          path="/php-deserializer"
                          element={<PhpDeserializerPage />}
                        />
                        <Route
                          path="/php-to-json"
                          element={<PhpToJsonPage />}
                        />
                        <Route
                          path="/json-to-php"
                          element={<JsonToPhpPage />}
                        />
                        <Route
                          path="/certificate-decoder"
                          element={<CertificateDecoderPage />}
                        />
                        <Route
                          path="/character-word-counter"
                          element={<CharacterWordCounterPage />}
                        />
                        <Route path="/url-parser" element={<UrlParserPage />} />
                        <Route
                          path="/lorem-ipsum"
                          element={<LoremIpsumGeneratorPage />}
                        />
                        <Route path="/svg-to-css" element={<SvgToCssPage />} />
                        <Route
                          path="/discord-timestamp"
                          element={<DiscordTimestampPage />}
                        />
                        <Route
                          path="/text-diff"
                          element={<TextDiffCheckerPage />}
                        />
                        <Route
                          path="/image-optimizer"
                          element={<ImageOptimizerPage />}
                        />
                        <Route path="/ini-parser" element={<IniParserPage />} />
                        <Route path="/css-to-svg" element={<CssToSvgPage />} />
                        <Route
                          path="/pomodoro-timer"
                          element={<PomodoroTimerPage />}
                        />
                        <Route
                          path="/text-statistics-analyzer"
                          element={<TextStatisticsAnalyzerPage />}
                        />
                        <Route
                          path="/toml-parser"
                          element={<TomlParserPage />}
                        />
                        <Route
                          path="/voice-transcription"
                          element={<VoiceTranscriptionPage />}
                        />
                        <Route
                          path="/unit-converter"
                          element={<UnitConverterPage />}
                        />
                        <Route
                          path="/world-clock"
                          element={<WorldClockPage />}
                        />
                        <Route path="/stopwatch" element={<StopwatchPage />} />
                        <Route
                          path="/bmi-calculator"
                          element={<BMICalculatorPage />}
                        />
                        <Route
                          path="/code-comparison"
                          element={<CodeComparisonPage />}
                        />
                        <Route path="/kanban" element={<KanbanPage />} />
                        <Route path="/port-kill" element={<PortKillPage />} />
                        <Route path="/smart-file-renamer" element={<SmartFileRenamerPage />} />
                        <Route
                          path="/clipboard-history"
                          element={<ClipboardHistoryPage />}
                        />
                        <Route path="/screenshot-studio" element={<ScreenshotStudioPage />} />
                        <Route path="/screen-recorder" element={<ScreenRecorderPage />} />
                        <Route path="/video-editor" element={<VideoEditorPage />} />
                        <Route path="/capture-library" element={<CaptureLibraryPage />} />
                      </Route>
                    </Routes>
                  </React.Suspense>
                  <Toaster />
                  <CaptureSessionControls />
                  {/* Close confirmation dialog */}
                  <Dialog
                    open={showCloseDialog}
                    onOpenChange={setShowCloseDialog}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Close DevKitHub</DialogTitle>
                        <DialogDescription>
                          ¿What do you want to do when closing the window?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="remember-choice"
                            checked={rememberChoice}
                            onCheckedChange={(v) => setRememberChoice(!!v)}
                          />
                          <Label htmlFor="remember-choice">
                            Remember my selection
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <div className="flex w-full justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleCloseSelection("tray")}
                          >
                            Leave in the tray
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleCloseSelection("quit")}
                          >
                            Exit
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </HashRouter>
              </EditorSettingsProvider>
            </AutosaveSettingsProvider>
          </ClipboardSettingsProvider>
        </UpgradeModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

function render() {
  const root = ReactDOM.createRoot(document.getElementById("app"));
  root.render(<App />);
}

render();
