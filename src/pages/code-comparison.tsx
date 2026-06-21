import React, { useCallback, useRef, useMemo, useState } from "react";
import { Download, Settings2, AtSign } from "lucide-react";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { sql } from "@codemirror/lang-sql";
import { EditorView, Decoration, DecorationSet } from "@codemirror/view";
import { StateField, Extension } from "@codemirror/state";
import { toPng, toCanvas } from "html-to-image";
import { ToolCopyButton, ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolEditorPanel,
  ToolErrorBanner,
} from "../components/tool-page-layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToolState } from "../hooks/useToolState";
import { AppCodeMirror } from "../components/app-code-mirror";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Chunk {
  text: string;
  glow: boolean;
}

interface Line {
  chunks: Chunk[];
  annotation?: string;
}

interface CodeSection {
  lines: Line[];
}

interface ComparisonData {
  title: string;
  language: string;
  languageLeft?: string;
  languageRight?: string;
  bad: CodeSection;
  good: CodeSection;
}

type ComparisonMode = "bad-vs-good" | "language-compare";

// ─── Samples ────────────────────────────────────────────────────────────────────

const SAMPLE_BAD_VS_GOOD: ComparisonData = {
  title: "Type-Safe API Calls",
  language: "tsx",
  bad: {
    lines: [
      { chunks: [{ text: "async function fetchUser(id) {", glow: false }] },
      { chunks: [{ text: "  const res = await fetch(`/api/users/${id}`);", glow: false }] },
      { chunks: [{ text: "  const data = await res.json();", glow: true }], annotation: "No type safety — data is 'any'" },
      { chunks: [{ text: "", glow: false }] },
      { chunks: [{ text: "  if (data.error) {", glow: false }] },
      { chunks: [{ text: "    console.log(data.error);", glow: true }], annotation: "Silent failure, no error handling" },
      { chunks: [{ text: "  }", glow: false }] },
      { chunks: [{ text: "", glow: false }] },
      { chunks: [{ text: "  return data;", glow: true }], annotation: "Caller has no idea what shape this is" },
      { chunks: [{ text: "}", glow: false }] },
    ],
  },
  good: {
    lines: [
      { chunks: [{ text: "interface User {", glow: false }] },
      { chunks: [{ text: "  id: string;", glow: false }] },
      { chunks: [{ text: "  name: string;", glow: false }] },
      { chunks: [{ text: "  email: string;", glow: false }] },
      { chunks: [{ text: "}", glow: false }] },
      { chunks: [{ text: "", glow: false }] },
      { chunks: [{ text: "async function fetchUser(id: string): Promise<User> {", glow: true }], annotation: "Typed params and return value" },
      { chunks: [{ text: "  const res = await fetch(`/api/users/${id}`);", glow: false }] },
      { chunks: [{ text: "  if (!res.ok) throw new Error(res.statusText);", glow: true }], annotation: "Explicit error handling" },
      { chunks: [{ text: "  return res.json() as Promise<User>;", glow: true }], annotation: "Type assertion ensures safety" },
      { chunks: [{ text: "}", glow: false }] },
    ],
  },
};

const SAMPLE_LANG_COMPARE: ComparisonData = {
  title: "HTTP GET Request",
  language: "javascript",
  languageLeft: "javascript",
  languageRight: "python",
  bad: {
    lines: [
      { chunks: [{ text: "async function getUser(id) {", glow: false }] },
      { chunks: [{ text: "  const res = await fetch(`/api/users/${id}`);", glow: true }] },
      { chunks: [{ text: "  const data = await res.json();", glow: true }] },
      { chunks: [{ text: "  return data;", glow: false }] },
      { chunks: [{ text: "}", glow: false }] },
    ],
  },
  good: {
    lines: [
      { chunks: [{ text: "import requests", glow: false }] },
      { chunks: [{ text: "", glow: false }] },
      { chunks: [{ text: "def get_user(id):", glow: false }] },
      { chunks: [{ text: "    res = requests.get(f\"/api/users/{id}\")", glow: true }] },
      { chunks: [{ text: "    return res.json()", glow: true }] },
    ],
  },
};

// ─── Config ─────────────────────────────────────────────────────────────────────

const WIDTH_OPTIONS = [
  { value: "600", label: "600px" },
  { value: "800", label: "800px" },
  { value: "1000", label: "1000px" },
  { value: "1200", label: "1200px" },
  { value: "full", label: "Full width" },
];

const BG_PRESETS = [
  {
    id: "midnight",
    label: "Midnight",
    classes: "bg-gradient-to-br from-[#0a0a1a] via-[#0d0d20] to-[#0a0f1a]",
    overlay: "bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.04),transparent_50%)]",
  },
  {
    id: "obsidian",
    label: "Obsidian",
    classes: "bg-gradient-to-br from-[#09090b] via-[#0c0c0f] to-[#09090b]",
    overlay: "bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02),transparent_60%)]",
  },
  {
    id: "ocean",
    label: "Ocean",
    classes: "bg-gradient-to-br from-[#020617] via-[#0c1929] to-[#041225]",
    overlay: "bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.06),transparent_50%)]",
  },
  {
    id: "aurora",
    label: "Aurora",
    classes: "bg-gradient-to-br from-[#0a0a1a] via-[#0f172a] to-[#1a0a2e]",
    overlay: "bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.05),transparent_40%),radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.04),transparent_40%)]",
  },
  {
    id: "ember",
    label: "Ember",
    classes: "bg-gradient-to-br from-[#0a0505] via-[#1a0a0a] to-[#0f0505]",
    overlay: "bg-[radial-gradient(ellipse_at_bottom_right,rgba(239,68,68,0.04),transparent_50%)]",
  },
  {
    id: "forest",
    label: "Forest",
    classes: "bg-gradient-to-br from-[#030a05] via-[#0a1a0d] to-[#051208]",
    overlay: "bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.04),transparent_50%)]",
  },
  {
    id: "pure-black",
    label: "Pure Black",
    classes: "bg-[#000000]",
    overlay: "",
  },
  {
    id: "carbon",
    label: "Carbon",
    classes: "bg-gradient-to-b from-[#1a1a2e] via-[#16162a] to-[#0f0f1a]",
    overlay: "bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_50%)]",
  },
];

interface SignatureConfig {
  enabled: boolean;
  text: string;
  showTwitter: boolean;
  showGithub: boolean;
  showLinkedin: boolean;
  showWeb: boolean;
  twitter: string;
  github: string;
  linkedin: string;
  web: string;
}

interface ToolState {
  input: string;
  width: string;
  background: string;
  mode: ComparisonMode;
  leftCode: string;
  rightCode: string;
  signature: SignatureConfig;
}

const defaultSignature: SignatureConfig = {
  enabled: false,
  text: "",
  showTwitter: false,
  showGithub: false,
  showLinkedin: false,
  showWeb: false,
  twitter: "",
  github: "",
  linkedin: "",
  web: "",
};

const initialState: ToolState = {
  input: "",
  width: "full",
  background: "midnight",
  mode: "bad-vs-good",
  leftCode: "",
  rightCode: "",
  signature: defaultSignature,
};

// ─── Language extensions ────────────────────────────────────────────────────────

const LANG_MAP: Record<string, () => Extension> = {
  javascript: () => javascript(),
  js: () => javascript(),
  typescript: () => javascript({ typescript: true, jsx: true }),
  ts: () => javascript({ typescript: true, jsx: true }),
  jsx: () => javascript({ jsx: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  python: () => python(),
  py: () => python(),
  css: () => css(),
  html: () => html(),
  sql: () => sql(),
  json: () => json(),
};

function getLanguageExtension(lang: string): Extension[] {
  const factory = LANG_MAP[lang.toLowerCase()];
  return factory ? [factory()] : [];
}

// ─── Decorations ────────────────────────────────────────────────────────────────

const badGlowDecoration = Decoration.line({ class: "cm-glow-bad" });
const goodGlowDecoration = Decoration.line({ class: "cm-glow-good" });
const leftGlowDecoration = Decoration.line({ class: "cm-glow-left" });
const rightGlowDecoration = Decoration.line({ class: "cm-glow-right" });

function buildGlowExtension(
  glowLines: number[],
  variant: "bad" | "good" | "left" | "right",
): Extension {
  const lineDecoration =
    variant === "bad" ? badGlowDecoration :
    variant === "good" ? goodGlowDecoration :
    variant === "left" ? leftGlowDecoration :
    rightGlowDecoration;

  return StateField.define<DecorationSet>({
    create(state) {
      const decorations: any[] = [];
      for (const lineNum of glowLines) {
        if (lineNum >= 1 && lineNum <= state.doc.lines) {
          const line = state.doc.line(lineNum);
          decorations.push(lineDecoration.range(line.from));
        }
      }
      decorations.sort((a: any, b: any) => a.from - b.from || a.startSide - b.startSide);
      return Decoration.set(decorations);
    },
    update(value) {
      return value;
    },
    provide: (f) => EditorView.decorations.from(f),
  });
}

const glowTheme = EditorView.theme({
  ".cm-glow-bad": {
    backgroundColor: "rgba(239, 68, 68, 0.08) !important",
    textShadow: "0 0 8px rgba(248, 113, 113, 0.7)",
    borderLeft: "2px solid rgba(248, 113, 113, 0.6)",
    paddingLeft: "6px !important",
  },
  ".cm-glow-good": {
    backgroundColor: "rgba(34, 197, 94, 0.08) !important",
    textShadow: "0 0 8px rgba(74, 222, 128, 0.7)",
    borderLeft: "2px solid rgba(74, 222, 128, 0.6)",
    paddingLeft: "6px !important",
  },
  ".cm-glow-left": {
    backgroundColor: "rgba(99, 102, 241, 0.08) !important",
    textShadow: "0 0 8px rgba(129, 140, 248, 0.7)",
    borderLeft: "2px solid rgba(129, 140, 248, 0.6)",
    paddingLeft: "6px !important",
  },
  ".cm-glow-right": {
    backgroundColor: "rgba(234, 179, 8, 0.08) !important",
    textShadow: "0 0 8px rgba(250, 204, 21, 0.7)",
    borderLeft: "2px solid rgba(250, 204, 21, 0.6)",
    paddingLeft: "6px !important",
  },
});

// ─── Code Block (JSON mode — read-only preview) ─────────────────────────────────

function CodeBlock({
  section,
  variant,
  language,
  label,
}: {
  section: CodeSection;
  variant: "bad" | "good" | "left" | "right";
  language: string;
  label?: string;
}) {
  const headerColor =
    variant === "bad" ? "text-red-400 border-red-900/40" :
    variant === "good" ? "text-green-400 border-green-900/40" :
    variant === "left" ? "text-indigo-400 border-indigo-900/40" :
    "text-yellow-400 border-yellow-900/40";
  const headerIcon =
    variant === "bad" ? "✗" :
    variant === "good" ? "✓" :
    "◀";
  const headerLabel = label || (
    variant === "bad" ? "Bad" :
    variant === "good" ? "Good" :
    variant === "left" ? "Left" : "Right"
  );
  const headerBg =
    variant === "bad" ? "bg-red-950/40" :
    variant === "good" ? "bg-green-950/40" :
    variant === "left" ? "bg-indigo-950/40" :
    "bg-yellow-950/40";

  const { code, glowLines } = useMemo(() => {
    const lines: string[] = [];
    const glow: number[] = [];
    let lineIdx = 0;
    section.lines.forEach((line) => {
      const text = line.chunks.map((c) => c.text).join("");
      lines.push(text);
      lineIdx++;
      if (line.chunks.some((c) => c.glow)) {
        glow.push(lineIdx);
      }
      if (line.annotation) {
        lines.push(`// ${line.annotation}`);
        lineIdx++;
      }
    });
    return { code: lines.join("\n"), glowLines: glow };
  }, [section]);

  const extensions = useMemo(
    () => [
      ...getLanguageExtension(language),
      buildGlowExtension(glowLines, variant),
      glowTheme,
    ],
    [language, glowLines, variant],
  );

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl backdrop-blur-sm h-full">
      <div
        className={`flex items-center justify-between px-4 py-2 ${headerBg} border-b ${headerColor}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{headerIcon}</span>
          <span className="text-xs font-semibold tracking-widest uppercase">
            {headerLabel}
          </span>
        </div>
        <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">
          {language}
        </span>
      </div>

      <div className="flex-1 min-h-0">
        <AppCodeMirror
          value={code}
          editable={false}
          className="h-full"
          extensions={[
            ...extensions,
            EditorView.lineWrapping,
            EditorView.theme({
              ".cm-activeLine": { backgroundColor: "transparent !important" },
              ".cm-activeLineGutter": { backgroundColor: "transparent !important" },
              ".cm-cursor": { display: "none !important" },
              "&.cm-focused .cm-selectionBackground": { backgroundColor: "transparent !important" },
              ".cm-scroller": { overflow: "hidden !important" },
              "&": { height: "100%" },
            }),
          ]}
          height="100%"
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
        />
      </div>
    </div>
  );
}

// ─── Editable Code Block (for direct editing mode) ──────────────────────────────

function EditableCodeBlock({
  value,
  onChange,
  language,
  variant,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  language: string;
  variant: "bad" | "good" | "left" | "right";
  label: string;
}) {
  const headerColor =
    variant === "bad" ? "text-red-400 border-red-900/40" :
    variant === "good" ? "text-green-400 border-green-900/40" :
    variant === "left" ? "text-indigo-400 border-indigo-900/40" :
    "text-yellow-400 border-yellow-900/40";
  const headerBg =
    variant === "bad" ? "bg-red-950/40" :
    variant === "good" ? "bg-green-950/40" :
    variant === "left" ? "bg-indigo-950/40" :
    "bg-yellow-950/40";

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl backdrop-blur-sm h-full">
      <div
        className={`flex items-center justify-between px-4 py-2 ${headerBg} border-b ${headerColor}`}
      >
        <span className="text-xs font-semibold tracking-widest uppercase">
          {label}
        </span>
        <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">
          {language}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <AppCodeMirror
          value={value}
          onChange={onChange}
          className="h-full"
          extensions={[
            ...getLanguageExtension(language),
            EditorView.lineWrapping,
            EditorView.theme({
              "&": { height: "100%" },
              ".cm-scroller": { overflow: "auto !important" },
            }),
          ]}
          height="100%"
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
          }}
        />
      </div>
    </div>
  );
}

// ─── Signature Bar (rendered inside the export preview) ─────────────────────────

function SignatureBar({ signature }: { signature: SignatureConfig }) {
  const socials: { show: boolean; value: string; icon: React.ReactNode }[] = [
    {
      show: signature.showTwitter && !!signature.twitter,
      value: signature.twitter,
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      show: signature.showGithub && !!signature.github,
      value: signature.github,
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      ),
    },
    {
      show: signature.showLinkedin && !!signature.linkedin,
      value: signature.linkedin,
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      show: signature.showWeb && !!signature.web,
      value: signature.web,
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      ),
    },
  ];

  const activeSocials = socials.filter((s) => s.show);
  if (!signature.text && activeSocials.length === 0) return null;

  return (
    <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
      {signature.text && (
        <span className="text-xs text-white/40 font-medium tracking-wide">
          {signature.text}
        </span>
      )}
      {activeSocials.length > 0 && (
        <div className="flex items-center gap-3 ml-auto">
          {activeSocials.map((s, idx) => (
            <div key={idx} className="flex items-center gap-1 text-white/40">
              {s.icon}
              <span className="text-[11px] font-mono">{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Signature Settings Panel ───────────────────────────────────────────────────

function SignaturePanel({
  signature,
  onChange,
}: {
  signature: SignatureConfig;
  onChange: (sig: SignatureConfig) => void;
}) {
  const update = (partial: Partial<SignatureConfig>) => {
    onChange({ ...signature, ...partial });
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Signature / Watermark</Label>
        </div>
        <Switch
          checked={signature.enabled}
          onCheckedChange={(v) => update({ enabled: v })}
        />
      </div>

      {signature.enabled && (
        <div className="space-y-3 pt-1">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Custom text (e.g. your name or tagline)
            </Label>
            <Input
              value={signature.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="@yourname · yoursite.dev"
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Switch
                  checked={signature.showTwitter}
                  onCheckedChange={(v) => update({ showTwitter: v })}
                />
                <Label className="text-xs">X / Twitter</Label>
              </div>
              {signature.showTwitter && (
                <Input
                  value={signature.twitter}
                  onChange={(e) => update({ twitter: e.target.value })}
                  placeholder="@handle"
                  className="h-7 text-xs"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Switch
                  checked={signature.showGithub}
                  onCheckedChange={(v) => update({ showGithub: v })}
                />
                <Label className="text-xs">GitHub</Label>
              </div>
              {signature.showGithub && (
                <Input
                  value={signature.github}
                  onChange={(e) => update({ github: e.target.value })}
                  placeholder="username"
                  className="h-7 text-xs"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Switch
                  checked={signature.showLinkedin}
                  onCheckedChange={(v) => update({ showLinkedin: v })}
                />
                <Label className="text-xs">LinkedIn</Label>
              </div>
              {signature.showLinkedin && (
                <Input
                  value={signature.linkedin}
                  onChange={(e) => update({ linkedin: e.target.value })}
                  placeholder="/in/username"
                  className="h-7 text-xs"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Switch
                  checked={signature.showWeb}
                  onCheckedChange={(v) => update({ showWeb: v })}
                />
                <Label className="text-xs">Website</Label>
              </div>
              {signature.showWeb && (
                <Input
                  value={signature.web}
                  onChange={(e) => update({ web: e.target.value })}
                  placeholder="yoursite.dev"
                  className="h-7 text-xs"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export function CodeComparisonPage() {
  const [state, setState, clearState] = useToolState(
    "code-comparison",
    initialState,
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState(false);

  const { parsed, error } = useMemo(() => {
    if (!state.input.trim()) {
      return { parsed: null, error: "" };
    }
    try {
      const data = JSON.parse(state.input) as ComparisonData;
      if (!data.title || !data.bad || !data.good) {
        return { parsed: null, error: "JSON must contain title, bad, and good fields" };
      }
      return { parsed: data, error: "" };
    } catch (e) {
      return { parsed: null, error: (e as Error).message };
    }
  }, [state.input]);

  const exportAs = useCallback(async (format: "png" | "webp") => {
    if (!previewRef.current) return;
    const filename = parsed?.title?.replace(/\s+/g, "-").toLowerCase() || "code-comparison";
    try {
      if (format === "png") {
        const dataUrl = await toPng(previewRef.current, {
          pixelRatio: 2,
          backgroundColor: "#0a0a0f",
        });
        const link = document.createElement("a");
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const canvas = await toCanvas(previewRef.current, {
          pixelRatio: 2,
          backgroundColor: "#0a0a0f",
        });
        const dataUrl = canvas.toDataURL("image/webp", 0.92);
        const link = document.createElement("a");
        link.download = `${filename}.webp`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [parsed]);

  const loadSample = useCallback(() => {
    const sample = state.mode === "bad-vs-good" ? SAMPLE_BAD_VS_GOOD : SAMPLE_LANG_COMPARE;
    setState((prev) => ({ ...prev, input: JSON.stringify(sample, null, 2) }));
  }, [state.mode, setState]);

  const previewWidth = state.width === "full" ? "100%" : `${state.width}px`;
  const activeBg = BG_PRESETS.find((b) => b.id === state.background) || BG_PRESETS[0];

  const isLangCompare = state.mode === "language-compare";
  const leftLang = parsed?.languageLeft || parsed?.language || "typescript";
  const rightLang = parsed?.languageRight || parsed?.language || "typescript";

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Code Comparison"
        description="Visual code comparison with neon glow effects — bad vs good, or cross-language"
      />

      {/* Mode selector */}
      <div className="flex items-center gap-4 mb-4">
        <Tabs
          value={state.mode}
          onValueChange={(v) => setState((prev) => ({ ...prev, mode: v as ComparisonMode }))}
        >
          <TabsList>
            <TabsTrigger value="bad-vs-good">Bad vs Good</TabsTrigger>
            <TabsTrigger value="language-compare">Language Compare</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant={editMode ? "default" : "outline"}
          size="sm"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "Preview Mode" : "Edit Code"}
        </Button>
      </div>

      {/* Edit mode: two side-by-side editable code blocks */}
      {editMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 h-[400px]">
          <EditableCodeBlock
            value={state.leftCode}
            onChange={(v) => setState((prev) => ({ ...prev, leftCode: v }))}
            language={leftLang}
            variant={isLangCompare ? "left" : "bad"}
            label={isLangCompare ? `Left (${leftLang})` : "Bad Code"}
          />
          <EditableCodeBlock
            value={state.rightCode}
            onChange={(v) => setState((prev) => ({ ...prev, rightCode: v }))}
            language={rightLang}
            variant={isLangCompare ? "right" : "good"}
            label={isLangCompare ? `Right (${rightLang})` : "Good Code"}
          />
        </div>
      )}

      {/* JSON input mode */}
      {!editMode && (
        <ToolEditorPanel
          label="JSON Input"
          heightClass="h-[calc(100vh-42rem)]"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={loadSample}>
                Sample
              </Button>
              <ToolCopyButton value={state.input} />
              <ToolClearButton onClear={() => clearState()} />
            </>
          }
        >
          <AppCodeMirror
            value={state.input}
            className="h-full"
            height="100%"
            width="100%"
            extensions={[json()]}
            onChange={(value) => setState((prev) => ({ ...prev, input: value }))}
            placeholder='{"title": "...", "language": "...", "bad": {...}, "good": {...}}'
          />
        </ToolEditorPanel>
      )}

      <ToolErrorBanner error={error} />

      {parsed && !editMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Width</Label>
                <Select
                  value={state.width}
                  onValueChange={(v) => setState((prev) => ({ ...prev, width: v }))}
                >
                  <SelectTrigger className="w-[110px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WIDTH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Background</Label>
                <Select
                  value={state.background}
                  onValueChange={(v) => setState((prev) => ({ ...prev, background: v }))}
                >
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BG_PRESETS.map((bg) => (
                      <SelectItem key={bg.id} value={bg.id}>
                        {bg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportAs("png")}>
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAs("webp")}>
                  Export as WebP
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <SignaturePanel
            signature={state.signature ?? defaultSignature}
            onChange={(sig) => setState((prev) => ({ ...prev, signature: sig }))}
          />

          <div className="flex justify-center">
            <div
              ref={previewRef}
              style={{ width: previewWidth, maxWidth: "100%" }}
              className="relative rounded-2xl overflow-hidden"
            >
              <div className={`absolute inset-0 ${activeBg.classes}`} />
              {activeBg.overlay && (
                <div className={`absolute inset-0 ${activeBg.overlay}`} />
              )}
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl" />

              <div className="relative p-8 md:p-10">
                <div className="text-center mb-8">
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {parsed.title}
                  </h3>
                  <div className="mt-2 h-px w-16 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                  <CodeBlock
                    section={parsed.bad}
                    variant={isLangCompare ? "left" : "bad"}
                    language={leftLang}
                    label={isLangCompare ? leftLang : undefined}
                  />
                  <CodeBlock
                    section={parsed.good}
                    variant={isLangCompare ? "right" : "good"}
                    language={rightLang}
                    label={isLangCompare ? rightLang : undefined}
                  />
                </div>

                {/* Signature / watermark */}
                {state.signature.enabled && (
                  <SignatureBar signature={state.signature} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolPageContainer>
  );
}
