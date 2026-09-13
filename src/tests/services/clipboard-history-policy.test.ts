import { describe, expect, it } from "vitest";
import {
  classifyClipboardContent,
  evaluateClipboardRules,
  isValidClipboardRule,
  purgeAndLimitHistory,
} from "../../services/clipboard/history-policy";
import {
  ClipboardHistoryItem,
  ClipboardHistoryRule,
} from "../../types/clipboard-history";

function rule(
  overrides: Partial<ClipboardHistoryRule> = {},
): ClipboardHistoryRule {
  return {
    id: "rule-1",
    name: "Private links",
    enabled: true,
    matchType: "contains",
    pattern: "example.com/private",
    caseSensitive: false,
    action: "ignore",
    expiresAfterMinutes: null,
    ...overrides,
  };
}

function item(
  id: string,
  createdAt: number,
  overrides: Partial<ClipboardHistoryItem> = {},
): ClipboardHistoryItem {
  return {
    id,
    type: "text",
    text: id,
    formats: ["text/plain"],
    signature: id,
    createdAt,
    updatedAt: createdAt,
    expiresAt: null,
    pinned: false,
    tags: [],
    collection: "Clipboard",
    byteSize: id.length,
    secret: false,
    ...overrides,
  };
}

describe("clipboard history content classification", () => {
  it("recognizes links, code, files and images while treating rich text as text", () => {
    expect(classifyClipboardContent("https://devkithub.com", "", false)).toBe(
      "url",
    );
    expect(classifyClipboardContent("const answer = 42;", "", false)).toBe(
      "code",
    );
    expect(classifyClipboardContent("Hello", "<b>Hello</b>", false)).toBe(
      "text",
    );
    expect(classifyClipboardContent("C:\\temp\\notes.txt", "", false)).toBe(
      "files",
    );
    expect(classifyClipboardContent("", "", true)).toBe("image");
  });
});

describe("clipboard history rules", () => {
  it("matches contains rules without case sensitivity", () => {
    const result = evaluateClipboardRules(
      "HTTPS://EXAMPLE.COM/PRIVATE/123",
      [rule()],
      1_000,
    );
    expect(result.ignore).toBe(true);
    expect(result.matchedRuleIds).toEqual(["rule-1"]);
  });

  it("applies the shortest matching regex expiration", () => {
    const result = evaluateClipboardRules(
      "token=secret-123",
      [
        rule({
          id: "long",
          matchType: "regex",
          pattern: "secret-\\d+",
          action: "expire",
          expiresAfterMinutes: 60,
        }),
        rule({
          id: "short",
          pattern: "token=",
          action: "expire",
          expiresAfterMinutes: 5,
        }),
      ],
      10_000,
    );
    expect(result.ignore).toBe(false);
    expect(result.expiresAt).toBe(310_000);
    expect(result.matchedRuleIds).toEqual(["long", "short"]);
  });

  it("rejects invalid regular expressions", () => {
    expect(
      isValidClipboardRule(rule({ matchType: "regex", pattern: "[" })),
    ).toBe(false);
  });
});

describe("clipboard history retention", () => {
  it("purges expired entries and preserves pinned entries when limiting size", () => {
    const result = purgeAndLimitHistory(
      [
        item("expired", 5, { expiresAt: 999 }),
        item("new", 4),
        item("pinned", 3, { pinned: true }),
        item("old", 2),
      ],
      2,
      1_000,
    );

    expect(result.map((entry) => entry.id)).toEqual(["pinned", "new"]);
  });

  it("drops the oldest unpinned entries when the byte budget is reached", () => {
    const result = purgeAndLimitHistory(
      [
        item("new", 3, { byteSize: 60 }),
        item("middle", 2, { byteSize: 40 }),
        item("old", 1, { byteSize: 40 }),
      ],
      10,
      1_000,
      100,
    );

    expect(result.map((entry) => entry.id)).toEqual(["new", "middle"]);
  });
});
