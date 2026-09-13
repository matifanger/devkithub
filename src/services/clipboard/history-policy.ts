import {
  ClipboardHistoryItem,
  ClipboardHistoryItemType,
  ClipboardHistoryRule,
  ClipboardRuleEvaluation,
} from "../../types/clipboard-history";

export function classifyClipboardContent(
  text: string,
  html: string,
  hasImage: boolean,
  formats: string[] = [],
): ClipboardHistoryItemType {
  const trimmed = text.trim();
  const loweredFormats = formats.map((format) => format.toLowerCase());

  if (hasImage && !trimmed) return "image";
  if (
    loweredFormats.some(
      (format) => format.includes("filename") || format.includes("file-list"),
    ) ||
    (trimmed.length > 0 &&
      trimmed
        .split(/\r?\n/)
        .every((line) => /^(?:[a-z]:\\|\\\\|\/).+/i.test(line.trim())))
  ) {
    return "files";
  }
  if (hasImage) return "image";

  if (trimmed) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return "url";
      }
    } catch {
      // It is not a standalone URL.
    }
  }

  const codePatterns = [
    /(?:const|let|var|function|class|interface|type)\s+[\w$]+/,
    /(?:import|export)\s+(?:\{|default|\*)/,
    /<\/?[a-z][^>]*>/i,
    /\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\b[\s\S]+\b(?:FROM|INTO|TABLE|SET)\b/i,
    /\{\s*["'][^"']+["']\s*:/,
    /(?:^|\n)\s*(?:def|class)\s+\w+/,
    /=>|console\.log\(|\breturn\s+[^;]+/,
  ];

  if (codePatterns.some((pattern) => pattern.test(trimmed))) return "code";
  return "text";
}

export function evaluateClipboardRules(
  content: string,
  rules: ClipboardHistoryRule[],
  now = Date.now(),
): ClipboardRuleEvaluation {
  let expiresAt: number | null = null;
  const matchedRuleIds: string[] = [];

  for (const rule of rules) {
    if (!rule.enabled || !rule.pattern) continue;

    let matched = false;
    if (rule.matchType === "contains") {
      const haystack = rule.caseSensitive
        ? content
        : content.toLocaleLowerCase();
      const needle = rule.caseSensitive
        ? rule.pattern
        : rule.pattern.toLocaleLowerCase();
      matched = haystack.includes(needle);
    } else {
      try {
        matched = new RegExp(rule.pattern, rule.caseSensitive ? "" : "i").test(
          content,
        );
      } catch {
        matched = false;
      }
    }

    if (!matched) continue;
    matchedRuleIds.push(rule.id);

    if (rule.action === "ignore") {
      return { ignore: true, expiresAt: null, matchedRuleIds };
    }

    if (
      rule.action === "expire" &&
      rule.expiresAfterMinutes !== null &&
      rule.expiresAfterMinutes > 0
    ) {
      const candidate = now + rule.expiresAfterMinutes * 60_000;
      expiresAt =
        expiresAt === null ? candidate : Math.min(expiresAt, candidate);
    }
  }

  return { ignore: false, expiresAt, matchedRuleIds };
}

export function purgeAndLimitHistory(
  items: ClipboardHistoryItem[],
  maxItems: number,
  now = Date.now(),
  maxBytes = Number.POSITIVE_INFINITY,
): ClipboardHistoryItem[] {
  const active = items.filter(
    (item) => item.expiresAt === null || item.expiresAt > now,
  );

  const pinned = active
    .filter((item) => item.pinned)
    .sort((a, b) => b.createdAt - a.createdAt);
  const regular = active
    .filter((item) => !item.pinned)
    .sort((a, b) => b.createdAt - a.createdAt);
  const regularSlots = Math.max(0, maxItems - pinned.length);
  let usedBytes = pinned.reduce((total, item) => total + item.byteSize, 0);
  const keptRegular: ClipboardHistoryItem[] = [];
  for (const item of regular.slice(0, regularSlots)) {
    if (usedBytes + item.byteSize > maxBytes) continue;
    keptRegular.push(item);
    usedBytes += item.byteSize;
  }

  return [...pinned, ...keptRegular];
}

export function isValidClipboardRule(rule: ClipboardHistoryRule): boolean {
  if (!rule.name.trim() || !rule.pattern) return false;
  if (
    rule.action === "expire" &&
    (!rule.expiresAfterMinutes || rule.expiresAfterMinutes <= 0)
  ) {
    return false;
  }
  if (rule.matchType === "regex") {
    try {
      new RegExp(rule.pattern, rule.caseSensitive ? "" : "i");
    } catch {
      return false;
    }
  }
  return true;
}
