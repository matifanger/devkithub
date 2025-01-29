import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import { ThemeProvider } from './providers/theme-provider';
import { AppLayout } from './layouts/app-layout';
import { LoginPage } from './pages/login';
import { HashGeneratorPage } from './pages/hash-generator';
import { MainPage } from './pages/index';
import { YamlToJsonPage } from './pages/yaml-to-json';
import { JsonFormatPage } from './pages/json-format';
import { UnixTimePage } from './pages/unix-time';
import { JwtDebuggerPage } from './pages/jwt-debug';
import { ColorConverterPage } from './pages/color-converter';
import { Base64StringEncoderDecoderPage } from './pages/base64-string-encoder-decoder';
import { Base64ImageEncoderDecoderPage } from './pages/base64-image-encoder-decoder';
import { RegexTesterPage } from './pages/regex-tester';
import { UrlEncoderDecoderPage } from './pages/url-encoder-decoder';
import { HtmlEntityEncoderDecoderPage } from './pages/html-entity-encoder-decoder';
import { BackslashEscapeUnescapePage } from './pages/backslash-escape-unescape';
import { HtmlBeautifyPage } from './pages/html-beautify';
import { CssBeautifyPage } from './pages/css-beautify';
import { JsBeautifyPage } from './pages/js-beautify';
import { XmlBeautifyPage } from './pages/xml-beautify';
import { LessBeautifyPage } from './pages/less-beautify';
import { ScssBeautifyPage } from './pages/scss-beautify';
import { LineSortDedupePage } from './pages/line-sort-dedupe';
import { HexToAsciiPage } from './pages/hex-to-ascii';
import { HtmlPreviewPage } from './pages/html-preview';
import { MarkdownPreviewPage } from './pages/markdown-preview';
import { HtmlToJsxPage } from './pages/html-to-jsx';
import { JsonToCsvPage } from './pages/json-to-csv';
import { CsvToJsonPage } from './pages/csv-to-json';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<MainPage />} />
              <Route path="/hash-generator" element={<HashGeneratorPage />} />
              <Route path="/yaml-to-json" element={<YamlToJsonPage />} />
              <Route path="/json-format" element={<JsonFormatPage />} />
              <Route path="/unix-time" element={<UnixTimePage />} />
              <Route path="/jwt-debug" element={<JwtDebuggerPage />} />
              <Route path="/color-converter" element={<ColorConverterPage />} />
              <Route path="/base64-string-encoder-decoder" element={<Base64StringEncoderDecoderPage />} />
              <Route path="/base64-image-encoder-decoder" element={<Base64ImageEncoderDecoderPage />} />
              <Route path="/regex-tester" element={<RegexTesterPage />} />
              <Route path="/url-encoder-decoder" element={<UrlEncoderDecoderPage />} />
              <Route path="/html-entity-encoder-decoder" element={<HtmlEntityEncoderDecoderPage />} />
              <Route path="/backslash-escape-unescape" element={<BackslashEscapeUnescapePage />} />
              <Route path="/html-beautify" element={<HtmlBeautifyPage />} />
              <Route path="/css-beautify" element={<CssBeautifyPage />} />
              <Route path="/js-beautify" element={<JsBeautifyPage />} />
              <Route path="/xml-beautify" element={<XmlBeautifyPage />} />
              <Route path="/less-beautify" element={<LessBeautifyPage />} />
              <Route path="/scss-beautify" element={<ScssBeautifyPage />} />
              <Route path="/line-sort-dedupe" element={<LineSortDedupePage />} />
              <Route path="/hex-to-ascii" element={<HexToAsciiPage />} />
              <Route path="/html-preview" element={<HtmlPreviewPage />} />
              <Route path="/markdown-preview" element={<MarkdownPreviewPage />} />
              <Route path="/html-to-jsx" element={<HtmlToJsxPage />} />
              <Route path="/json-to-csv" element={<JsonToCsvPage />} />
              <Route path="/csv-to-json" element={<CsvToJsonPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

function render() {
  const root = ReactDOM.createRoot(document.getElementById("app"));
  root.render(<App />);
}

render();
