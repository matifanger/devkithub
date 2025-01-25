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
