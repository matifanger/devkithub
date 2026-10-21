import * as path from "path";
import type {
  NamingPreset,
  OrganizeRule,
  RenamerSettings,
} from "../../types/smart-file-renamer";

export function safeName(value: string): string {
  let name = value
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\p{Cc}]/gu, "-")
    .trim()
    .replace(/[. ]+$/g, "");
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))
    name = `_${name}`;
  // Leave enough room for an extension and remain within common filesystem limits.
  while (Buffer.byteLength(name, "utf8") > 180)
    name = Array.from(name).slice(0, -1).join("");
  return name;
}

export function validateName(name: string, original: string): void {
  if (!name || name !== safeName(name) || name === "." || name === "..")
    throw new Error(
      "Use a valid filename without paths, reserved characters or trailing dots.",
    );
  if (path.extname(name).toLowerCase() !== path.extname(original).toLowerCase())
    throw new Error("The original file extension must be preserved.");
}

export function validateFolder(folder: string): string {
  if (!folder) return "";
  if (path.isAbsolute(folder) || /^[a-z]:/i.test(folder))
    throw new Error(
      "Organization folders must be relative to the source folder.",
    );
  const parts = folder.split(/[\\/]/);
  if (
    parts.some(
      (part) =>
        !part || part === "." || part === ".." || safeName(part) !== part,
    )
  )
    throw new Error(
      "Invalid organization folder. Use names such as Finance/Invoices.",
    );
  return parts.join(path.sep);
}

export function formatName(
  original: string,
  preset: NamingPreset,
  fields: Record<string, string>,
): { name: string; missing: string[] } {
  const missing: string[] = [];
  const extension = path.extname(original);
  let stem = preset.pattern.replace(
    /\{([a-zA-Z][\w]*)\}/g,
    (_match, key: string) => {
      const value = fields[key];
      if (!value) {
        missing.push(key);
        return "unknown";
      }
      return safeName(value).replace(/\s+/g, preset.separator);
    },
  );
  if (/[{}]/.test(stem))
    throw new Error(
      "Invalid template. Use placeholders such as {title}, {original} or {date}.",
    );
  if (preset.letterCase === "lower") stem = stem.toLowerCase();
  if (preset.letterCase === "upper") stem = stem.toUpperCase();
  stem = safeName(stem);
  if (!stem) throw new Error("The naming template produced an empty name.");
  // Extension is always attached by the tool, never supplied by the model.
  while (Buffer.byteLength(stem + extension, "utf8") > 180)
    stem = Array.from(stem).slice(0, -1).join("");
  return { name: stem + extension, missing };
}

export function matchFolder(
  rules: OrganizeRule[],
  original: string,
  content: string,
  fields: Record<string, string>,
): string {
  for (const rule of rules) {
    if (!rule.enabled || !rule.contains.trim()) continue;
    const value =
      rule.field === "extension"
        ? path.extname(original).slice(1)
        : rule.field === "name"
          ? original
          : rule.field === "content"
            ? content
            : fields[rule.field] || "";
    if (value.toLowerCase().includes(rule.contains.toLowerCase()))
      return validateFolder(rule.folder);
  }
  return "";
}

export function validateSettings(settings: RenamerSettings): void {
  if (!["off", "ollama", "compatible"].includes(settings.provider))
    throw new Error("Unknown AI provider.");
  if (
    !Array.isArray(settings.presets) ||
    !settings.presets.length ||
    settings.presets.length > 100
  )
    throw new Error("Keep between 1 and 100 presets.");
  if (
    new Set(settings.presets.map((p) => p.id)).size !== settings.presets.length
  )
    throw new Error("Preset IDs must be unique.");
  if (!settings.presets.some((p) => p.id === settings.activePreset))
    throw new Error("Choose an existing naming preset.");
  for (const preset of settings.presets) {
    if (
      !preset.name.trim() ||
      !preset.pattern.trim() ||
      preset.pattern.length > 500 ||
      preset.instructions.length > 8000
    )
      throw new Error(
        "Each preset needs a name and a template (up to 500 characters).",
      );
    if (
      !["preserve", "lower", "upper"].includes(preset.letterCase) ||
      ![" ", "-", "_"].includes(preset.separator)
    )
      throw new Error("Invalid text cleanup option.");
  }
  if (!Array.isArray(settings.rules) || settings.rules.length > 100)
    throw new Error("Use at most 100 organization rules.");
  for (const rule of settings.rules) {
    validateFolder(rule.folder);
    if (
      !["extension", "name", "content", "type", "vendor"].includes(rule.field)
    )
      throw new Error("Unknown rule field.");
  }
  if (settings.provider !== "off") localEndpoint(settings.endpoint);
}

export function localEndpoint(endpoint: string): string {
  const url = new URL(endpoint);
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "Use a local HTTP server at localhost, 127.0.0.1 or [::1]. Remote AI endpoints are not supported.",
    );
  }
  return url.toString().replace(/\/$/, "");
}
