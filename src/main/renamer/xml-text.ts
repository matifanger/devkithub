// Documents are data: strip markup, never execute or load external resources.
export function XMLParser(xml: string): string {
  return xml
    .replace(/<\/(?:w:p|a:p|text:p|p|h[1-6])>/g, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(amp|lt|gt|quot|apos);/g,
      (_match, entity: string) =>
        ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[entity],
    )
    .replace(/&#(x[\da-f]+|\d+);/gi, (_match, code: string) => {
      const value =
        code[0].toLowerCase() === "x"
          ? parseInt(code.slice(1), 16)
          : Number(code);
      return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : "";
    })
    .replace(/[ \t]+/g, " ")
    .trim();
}
