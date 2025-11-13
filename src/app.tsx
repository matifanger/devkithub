import axios from 'axios';
import React, { useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Checkbox } from './components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { Label } from './components/ui/label';
import { Toaster } from './components/ui/toaster';
import {
  LAUNCH_ON_STARTUP_KEY,
  REJECTED_VERSION_KEY,
  UPDATE_PREFERENCE_KEY,
} from './constants/settings-keys';
import { AuthProvider } from './contexts/auth-context';
import { ClipboardSettingsProvider } from './contexts/clipboard-settings-context';
import { EditorSettingsProvider } from './contexts/editor-settings-context';
import { useToast } from './hooks/use-toast';
import { AppLayout } from './layouts/app-layout';
import { AsciiToHexPage } from './pages/ascii-to-hex';
import { BackslashEscapeUnescapePage } from './pages/backslash-escape-unescape';
import { Base64ImageEncoderDecoderPage } from './pages/base64-image-encoder-decoder';
import { Base64StringEncoderDecoderPage } from './pages/base64-string-encoder-decoder';
import { CertificateDecoderPage } from './pages/certificate-decoder';
import { ColorConverterPage } from './pages/color-converter';
import { CronJobParserPage } from './pages/cron-job-parser';
import { CssBeautifyPage } from './pages/css-beautify';
import { CssToSvgPage } from './pages/css-to-svg';
import { CsvToJsonPage } from './pages/csv-to-json';
import { CurlToCodePage } from './pages/curl-to-code';
import { DiscordTimestampPage } from './pages/discord-timestamp';
import { DummyDataGeneratorPage } from './pages/dummy-data-generator';
import { EncodeDecodePage } from './pages/encode-decode';
import { ErbBeautifyPage } from './pages/erb-beautify';
import { HexToAsciiPage } from './pages/hex-to-ascii';
import { HtmlBeautifyPage } from './pages/html-beautify';
import { HtmlEntityEncoderDecoderPage } from './pages/html-entity-encoder-decoder';
import { HtmlPreviewPage } from './pages/html-preview';
import { HtmlToJsxPage } from './pages/html-to-jsx';
import { ImageOptimizerPage } from './pages/image-optimizer';
import { MainPage } from './pages/index';
import { JsBeautifyPage } from './pages/js-beautify';
import { JsonFormatPage } from './pages/json-format';
import { JsonToCodePage } from './pages/json-to-code';
import { JsonToCsvPage } from './pages/json-to-csv';
import { JsonToPhpPage } from './pages/json-to-php';
import { JsonToYamlPage } from './pages/json-to-yaml';
import { JwtDebuggerPage } from './pages/jwt-debug';
import { LessBeautifyPage } from './pages/less-beautify';
import { LineSortDedupePage } from './pages/line-sort-dedupe';
import { LoginPage } from './pages/login';
import { LoremIpsumGeneratorPage } from './pages/lorem-ipsum-generator';
import { MarkdownPreviewPage } from './pages/markdown-preview';
import { NumberBaseConverterPage } from './pages/number-base-converter';
import { PhpDeserializerPage } from './pages/php-deserializer';
import { PhpSerializerPage } from './pages/php-serializer';
import { PhpToJsonPage } from './pages/php-to-json';
import { PomodoroTimerPage } from './pages/pomodoro-timer';
import { QRCodePage } from './pages/qr-code';
import { RandomStringGeneratorPage } from './pages/random-string-generator';
import { RegexTesterPage } from './pages/regex-tester';
import { ScssBeautifyPage } from './pages/scss-beautify';
import { SqlFormatterPage } from './pages/sql-formatter';
import { StringCaseConverterPage } from './pages/string-case-converter';
import { SvgToCssPage } from './pages/svg-to-css';
import { TextDiffCheckerPage } from './pages/text-diff-checker';
import { UnixTimePage } from './pages/unix-time';
import { UrlEncoderDecoderPage } from './pages/url-encoder-decoder';
import { UrlParserPage } from './pages/url-parser';
import { ValidateLicensePage } from './pages/validate-license';
import { XmlBeautifyPage } from './pages/xml-beautify';
import { YamlToJsonPage } from './pages/yaml-to-json';
import { ThemeProvider } from './providers/theme-provider';
import { getBaseApiUrl } from './utils/environment';

const App = () => {
  const { toast } = useToast();
  const [showCloseDialog, setShowCloseDialog] = React.useState(false);
  const [rememberChoice, setRememberChoice] = React.useState(false);
  const [showAutostartDialog, setShowAutostartDialog] = React.useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  React.useEffect(() => {
    // Listen for main process request to show close dialog
    window.electron.onShowCloseDialog(() => {
      setShowCloseDialog(true);
    });
    // Listen for autostart question
    window.electron.onShowAutostartDialog(() => {
      setShowAutostartDialog(true);
    });
  }, []);

  // Fallback: proactively check if we should show the autostart dialog
  React.useEffect(() => {
    const ensureAutostartPrompt = async () => {
      try {
        const pref = await window.electron.settingsStore.get(LAUNCH_ON_STARTUP_KEY);
        const shouldShow = await window.electron.shouldShowAutostartDialog(pref);
        if (shouldShow) setShowAutostartDialog(true);
      } catch (err) {
        console.error('Failed checking autostart dialog need:', err);
      }
    };
    ensureAutostartPrompt();
  }, []);

  const handleCloseSelection = async (action: 'quit' | 'tray') => {
    await window.electron.sendCloseDialogSelection(action, rememberChoice);
    setShowCloseDialog(false);
  };

  const handleAutostartSelection = async (enable: boolean) => {
    await window.electron.sendAutostartSelection(enable);
    setShowAutostartDialog(false);
  };

  const checkForUpdates = async () => {
    try {
      // Check user preference for updates
      const updatesEnabled = await window.electron.settingsStore.get(UPDATE_PREFERENCE_KEY);

      // Default to true if preference is not set
      const shouldCheckUpdates = updatesEnabled === null || updatesEnabled === 'true';

      if (!shouldCheckUpdates) {
        console.log('Updates are disabled by user preference');
        return;
      }

      const response = await axios.get((await getBaseApiUrl()) + '/api/version');
      const latestVersion = response.data.version;
      const currentVersion = await window.electron.env.get('npm_package_version');

      console.log('latestVersion', latestVersion);
      console.log('currentVersion', currentVersion);

      // Check if this version was already rejected
      const rejectedVersion = await window.electron.settingsStore.get(REJECTED_VERSION_KEY);
      if (rejectedVersion === latestVersion) {
        console.log('This version was already rejected by the user');
        return;
      }

      if (latestVersion !== currentVersion) {
        const updateToast = toast({
          title: 'New version available!',
          description: `Version ${latestVersion} is now available. ${response.data.releaseNotes || 'Update for new features!'}`,
          duration: Infinity,
          action: (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.electron.openExternal('https://devkithub.com/downloads')}
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive"
              >
                Download
              </button>
            </div>
          ),
        });
      }
    } catch (err) {
      console.error('Error checking version:', err);
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <ClipboardSettingsProvider>
          <EditorSettingsProvider>
            <HashRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/validate-license" element={<ValidateLicensePage />} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<MainPage />} />
                  <Route path="/encode-decode" element={<EncodeDecodePage />} />
                  <Route path="/hash-generator" element={<EncodeDecodePage />} />
                  <Route path="/number-base-converter" element={<NumberBaseConverterPage />} />
                  <Route path="/yaml-to-json" element={<YamlToJsonPage />} />
                  <Route path="/json-to-yaml" element={<JsonToYamlPage />} />
                  <Route path="/json-format" element={<JsonFormatPage />} />
                  <Route path="/json-to-code" element={<JsonToCodePage />} />
                  <Route path="/curl-to-code" element={<CurlToCodePage />} />
                  <Route path="/unix-time" element={<UnixTimePage />} />
                  <Route path="/jwt-debug" element={<JwtDebuggerPage />} />
                  <Route path="/cron-job-parser" element={<CronJobParserPage />} />
                  <Route path="/color-converter" element={<ColorConverterPage />} />
                  <Route
                    path="/base64-string-encoder-decoder"
                    element={<Base64StringEncoderDecoderPage />}
                  />
                  <Route
                    path="/base64-image-encoder-decoder"
                    element={<Base64ImageEncoderDecoderPage />}
                  />
                  <Route path="/regex-tester" element={<RegexTesterPage />} />
                  <Route path="/url-encoder-decoder" element={<UrlEncoderDecoderPage />} />
                  <Route
                    path="/html-entity-encoder-decoder"
                    element={<HtmlEntityEncoderDecoderPage />}
                  />
                  <Route
                    path="/backslash-escape-unescape"
                    element={<BackslashEscapeUnescapePage />}
                  />
                  <Route path="/html-beautify" element={<HtmlBeautifyPage />} />
                  <Route path="/css-beautify" element={<CssBeautifyPage />} />
                  <Route path="/js-beautify" element={<JsBeautifyPage />} />
                  <Route path="/xml-beautify" element={<XmlBeautifyPage />} />
                  <Route path="/less-beautify" element={<LessBeautifyPage />} />
                  <Route path="/scss-beautify" element={<ScssBeautifyPage />} />
                  <Route path="/erb-beautify" element={<ErbBeautifyPage />} />
                  <Route path="/sql-formatter" element={<SqlFormatterPage />} />
                  <Route path="/line-sort-dedupe" element={<LineSortDedupePage />} />
                  <Route path="/hex-to-ascii" element={<HexToAsciiPage />} />
                  <Route path="/ascii-to-hex" element={<AsciiToHexPage />} />
                  <Route path="/html-preview" element={<HtmlPreviewPage />} />
                  <Route path="/markdown-preview" element={<MarkdownPreviewPage />} />
                  <Route path="/html-to-jsx" element={<HtmlToJsxPage />} />
                  <Route path="/json-to-csv" element={<JsonToCsvPage />} />
                  <Route path="/csv-to-json" element={<CsvToJsonPage />} />
                  <Route path="/string-case-converter" element={<StringCaseConverterPage />} />
                  <Route path="/random-string-generator" element={<RandomStringGeneratorPage />} />
                  <Route path="/dummy-data-generator" element={<DummyDataGeneratorPage />} />
                  <Route path="/qr-code" element={<QRCodePage />} />
                  <Route path="/php-serializer" element={<PhpSerializerPage />} />
                  <Route path="/php-deserializer" element={<PhpDeserializerPage />} />
                  <Route path="/php-to-json" element={<PhpToJsonPage />} />
                  <Route path="/json-to-php" element={<JsonToPhpPage />} />
                  <Route path="/certificate-decoder" element={<CertificateDecoderPage />} />
                  <Route path="/url-parser" element={<UrlParserPage />} />
                  <Route path="/lorem-ipsum" element={<LoremIpsumGeneratorPage />} />
                  <Route path="/svg-to-css" element={<SvgToCssPage />} />
                  <Route path="/discord-timestamp" element={<DiscordTimestampPage />} />
                  <Route path="/text-diff" element={<TextDiffCheckerPage />} />
                  <Route path="/image-optimizer" element={<ImageOptimizerPage />} />
                  <Route path="/css-to-svg" element={<CssToSvgPage />} />
                  <Route path="/pomodoro-timer" element={<PomodoroTimerPage />} />
                </Route>
              </Routes>
              <Toaster />
              {/* Close confirmation dialog */}
              <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
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
                      <Label htmlFor="remember-choice">Remember my selection</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <div className="flex w-full justify-end gap-2">
                      <Button variant="secondary" onClick={() => handleCloseSelection('tray')}>
                        Leave in the tray
                      </Button>
                      <Button variant="destructive" onClick={() => handleCloseSelection('quit')}>
                        Exit
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Autostart prompt dialog */}
              <Dialog open={showAutostartDialog} onOpenChange={setShowAutostartDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Launch at startup</DialogTitle>
                    <DialogDescription>
                      Would you like DevKitHub to start automatically when you sign in?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <div className="flex w-full justify-end gap-2">
                      <Button variant="secondary" onClick={() => handleAutostartSelection(false)}>
                        No, thanks
                      </Button>
                      <Button variant="default" onClick={() => handleAutostartSelection(true)}>
                        Enable
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </HashRouter>
          </EditorSettingsProvider>
        </ClipboardSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

function render() {
  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(<App />);
}

render();
