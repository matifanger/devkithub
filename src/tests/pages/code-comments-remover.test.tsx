import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@codemirror/lang-javascript", () => ({
  javascript: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-python", () => ({
  python: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-html", () => ({
  html: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-css", () => ({
  css: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-sass", () => ({
  sass: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-less", () => ({
  less: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-json", () => ({
  json: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-yaml", () => ({
  yaml: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-markdown", () => ({
  markdown: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-sql", () => ({
  sql: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-xml", () => ({
  xml: vi.fn(() => ({})),
}));

vi.mock("@codemirror/lang-php", () => ({
  php: vi.fn(() => ({})),
}));

vi.mock("@codemirror/view", () => ({
  EditorView: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    dispatch: vi.fn(),
  })),
  lineWrapping: vi.fn(),
}));

vi.mock("@uiw/codemirror-themes-all", () => ({}));

vi.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: vi.fn(
    ({ value, onChange, placeholder, readOnly, "data-testid": testId }) => {
      return (
        <textarea
          data-testid={testId || "codemirror"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      );
    },
  ),
}));

vi.mock("../../components/app-code-mirror", () => ({
  AppCodeMirror: vi.fn(
    ({ value, onChange, placeholder, readOnly, "data-testid": testId }) => {
      return (
        <textarea
          data-testid={testId || "codemirror"}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      );
    },
  ),
}));

vi.mock("../../contexts/editor-settings-context", () => ({
  useEditorSettings: vi.fn(() => ({
    fontSize: 14,
    editorThemeId: "githubDark",
  })),
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "dark", setTheme: vi.fn() })),
}));

vi.mock("../../hooks/useToolState", () => ({
  useToolState: vi.fn(() => {
    const [state, setState] = React.useState({
      language: "javascript",
      removeLineComments: true,
      removeBlockComments: true,
      preserveStrings: true,
      input: "",
    });
    return [state, setState, vi.fn()] as const;
  }),
}));

import { CodeCommentsRemoverPage } from "../../pages/code-comments-remover";

describe("CodeCommentsRemoverPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", () => {
    render(<CodeCommentsRemoverPage />);

    expect(screen.getByText("Code Comments Remover")).toBeDefined();
    expect(
      screen.getByText(
        "Remove comments from source code in 30+ programming languages",
      ),
    ).toBeDefined();
  });

  it("renders language selector", () => {
    render(<CodeCommentsRemoverPage />);

    expect(screen.getByText("Language")).toBeDefined();
  });

  it("renders option switches", () => {
    render(<CodeCommentsRemoverPage />);

    expect(screen.getByText("Remove Line Comments")).toBeDefined();
    expect(screen.getByText("Remove Block Comments")).toBeDefined();
    expect(screen.getByText("Preserve Strings")).toBeDefined();
  });

  it("renders input and output editors", () => {
    render(<CodeCommentsRemoverPage />);

    expect(screen.getByText("Input Code")).toBeDefined();
    expect(screen.getByText("Output Code")).toBeDefined();
  });

  it("renders action buttons", () => {
    render(<CodeCommentsRemoverPage />);

    expect(screen.getByText("Paste")).toBeDefined();
    expect(screen.getByText("Sample")).toBeDefined();
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("renders Paste button", () => {
    render(<CodeCommentsRemoverPage />);

    expect(screen.getByText("Paste")).toBeDefined();
  });

  it("displays JavaScript as default language", () => {
    render(<CodeCommentsRemoverPage />);

    expect(screen.getByText("JavaScript")).toBeDefined();
  });
});
