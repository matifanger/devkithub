import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import { AppLayout } from './layouts/app-layout';
import { LoginPage } from './pages/login';
import { HashGeneratorPage } from './pages/hash-generator';
import { MainPage } from './pages/index';
import { YamlToJsonPage } from './pages/yaml-to-json';
import { JsonFormatPage } from './pages/json-format';
import { UnixTimePage } from './pages/unix-time';
import { JwtDebuggerPage } from './pages/jwt-debug';
import { ColorConverterPage } from './pages/color-converter';

const App = () => {
  return (
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
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

function render() {
  const root = ReactDOM.createRoot(document.getElementById("app"));
  root.render(<App />);
}

render();
