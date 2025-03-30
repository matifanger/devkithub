import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import { AppLayout } from './layouts/app-layout';
import { AsciiToHexPage } from './pages/ascii-to-hex';
import { BackslashEscapeUnescapePage } from './pages/backslash-escape-unescape';
import { Base64ImageEncoderDecoderPage } from './pages/base64-image-encoder-decoder';
import { Base64StringEncoderDecoderPage } from './pages/base64-string-encoder-decoder';
import { CertificateDecoderPage } from './pages/certificate-decoder';
import { ColorConverterPage } from './pages/color-converter';
import { CronJobParserPage } from './pages/cron-job-parser';
import { CssBeautifyPage } from './pages/css-beautify';
import { CsvToJsonPage } from './pages/csv-to-json';
import { DummyDataGeneratorPage } from './pages/dummy-data-generator';
import { HashGeneratorPage } from './pages/hash-generator';
import { HexToAsciiPage } from './pages/hex-to-ascii';
import { HtmlBeautifyPage } from './pages/html-beautify';
import { HtmlEntityEncoderDecoderPage } from './pages/html-entity-encoder-decoder';
import { HtmlPreviewPage } from './pages/html-preview';
import { HtmlToJsxPage } from './pages/html-to-jsx';
import { MainPage } from './pages/index';
import { JsBeautifyPage } from './pages/js-beautify';
import { JsonFormatPage } from './pages/json-format';
import { JsonToCsvPage } from './pages/json-to-csv';
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
import { QRCodePage } from './pages/qr-code';
import { RandomStringGeneratorPage } from './pages/random-string-generator';
import { RegexTesterPage } from './pages/regex-tester';
import { ScssBeautifyPage } from './pages/scss-beautify';
import { SqlFormatterPage } from './pages/sql-formatter';
import { StringCaseConverterPage } from './pages/string-case-converter';
import { TextDiffCheckerPage } from './pages/text-diff-checker';
import { UnixTimePage } from './pages/unix-time';
import { UrlEncoderDecoderPage } from './pages/url-encoder-decoder';
import { UrlParserPage } from './pages/url-parser';
import { ValidateLicensePage } from './pages/validate-license';
import { XmlBeautifyPage } from './pages/xml-beautify';
import { YamlToJsonPage } from './pages/yaml-to-json';
import { ThemeProvider } from './providers/theme-provider';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/validate-license" element={<ValidateLicensePage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<MainPage />} />
              <Route path="/hash-generator" element={<HashGeneratorPage />} />
              <Route path="/number-base-converter" element={<NumberBaseConverterPage />} />
              <Route path="/yaml-to-json" element={<YamlToJsonPage />} />
              <Route path="/json-to-yaml" element={<JsonToYamlPage />} />
              <Route path="/json-format" element={<JsonFormatPage />} />
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
              <Route path="/backslash-escape-unescape" element={<BackslashEscapeUnescapePage />} />
              <Route path="/html-beautify" element={<HtmlBeautifyPage />} />
              <Route path="/css-beautify" element={<CssBeautifyPage />} />
              <Route path="/js-beautify" element={<JsBeautifyPage />} />
              <Route path="/xml-beautify" element={<XmlBeautifyPage />} />
              <Route path="/less-beautify" element={<LessBeautifyPage />} />
              <Route path="/scss-beautify" element={<ScssBeautifyPage />} />
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
              <Route path="/certificate-decoder" element={<CertificateDecoderPage />} />
              <Route path="/url-parser" element={<UrlParserPage />} />
              <Route path="/lorem-ipsum" element={<LoremIpsumGeneratorPage />} />
              <Route path="/text-diff" element={<TextDiffCheckerPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

function render() {
  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(<App />);
}

render();
