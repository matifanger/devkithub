import { ContentDetectionResult } from '../../types/clipboard';

export class ClipboardDetector {
  /**
   * Analyzes clipboard content and determines its type
   */
  static detectContentType(content: string): ContentDetectionResult {
    if (!content || content.trim().length === 0) {
      return { type: 'unknown', confidence: 0 };
    }

    const trimmedContent = content.trim();

    // JSON detection
    if (this.isJSON(trimmedContent)) {
      return { type: 'json', confidence: 0.95 };
    }

    // JWT detection
    if (this.isJWT(trimmedContent)) {
      return { type: 'jwt', confidence: 0.9 };
    }

    // Base64 detection
    if (this.isBase64(trimmedContent)) {
      return { type: 'base64', confidence: 0.8 };
    }

    // URL detection
    if (this.isURL(trimmedContent)) {
      return { type: 'url', confidence: 0.85 };
    }

    // Unix timestamp detection
    if (this.isUnixTimestamp(trimmedContent)) {
      return { type: 'unix-timestamp', confidence: 0.9 };
    }

    // Hex detection
    if (this.isHex(trimmedContent)) {
      return { type: 'hex', confidence: 0.8 };
    }

    // HTML detection
    if (this.isHTML(trimmedContent)) {
      return { type: 'html', confidence: 0.85 };
    }

    // CSS detection
    if (this.isCSS(trimmedContent)) {
      return { type: 'css', confidence: 0.8 };
    }

    // XML detection
    if (this.isXML(trimmedContent)) {
      return { type: 'xml', confidence: 0.8 };
    }

    // YAML detection
    if (this.isYAML(trimmedContent)) {
      return { type: 'yaml', confidence: 0.75 };
    }

    // SQL detection
    if (this.isSQL(trimmedContent)) {
      return { type: 'sql', confidence: 0.75 };
    }

    // JavaScript detection
    if (this.isJavaScript(trimmedContent)) {
      return { type: 'javascript', confidence: 0.7 };
    }

    // Cron expression detection
    if (this.isCron(trimmedContent)) {
      return { type: 'cron', confidence: 0.85 };
    }

    // CSV detection
    if (this.isCSV(trimmedContent)) {
      return { type: 'csv', confidence: 0.7 };
    }

    // Markdown detection
    if (this.isMarkdown(trimmedContent)) {
      return { type: 'markdown', confidence: 0.65 };
    }

    // CURL detection
    if (this.isCURL(trimmedContent)) {
      return { type: 'curl', confidence: 0.9 };
    }

    // PHP serialized detection
    if (this.isPHPSerialized(trimmedContent)) {
      return { type: 'php-serialized', confidence: 0.85 };
    }

    // Color detection
    if (this.isColor(trimmedContent)) {
      return { type: 'color', confidence: 0.8 };
    }

    // Regex detection
    if (this.isRegex(trimmedContent)) {
      return { type: 'regex', confidence: 0.7 };
    }

    // Number detection
    if (this.isNumber(trimmedContent)) {
      return { type: 'number', confidence: 0.6 };
    }

    return { type: 'text', confidence: 0.3 };
  }

  private static isJSON(content: string): boolean {
    try {
      JSON.parse(content);
      return (
        (content.startsWith('{') && content.endsWith('}')) ||
        (content.startsWith('[') && content.endsWith(']'))
      );
    } catch {
      return false;
    }
  }

  private static isJWT(content: string): boolean {
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    return jwtPattern.test(content) && content.split('.').length === 3;
  }

  private static isBase64(content: string): boolean {
    if (content.length < 4 || content.length % 4 !== 0) return false;
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Pattern.test(content) && content.length > 10;
  }

  private static isURL(content: string): boolean {
    try {
      new URL(content);
      return true;
    } catch {
      return false;
    }
  }

  private static isUnixTimestamp(content: string): boolean {
    const num = parseInt(content, 10);
    if (isNaN(num)) return false;
    // Unix timestamp should be between 1970 and ~2038 (roughly)
    return content.length >= 10 && content.length <= 13 && num > 0;
  }

  private static isHex(content: string): boolean {
    if (content.length % 2 !== 0) return false;
    const hexPattern = /^[0-9a-fA-F]+$/;
    return hexPattern.test(content) && content.length >= 2;
  }

  private static isHTML(content: string): boolean {
    const htmlPattern = /<\/?[a-z][\s\S]*>/i;
    return htmlPattern.test(content);
  }

  private static isCSS(content: string): boolean {
    const cssPattern = /[a-zA-Z-]+\s*:\s*[^;]+;|[.#][a-zA-Z-]+\s*\{|\}/;
    return cssPattern.test(content);
  }

  private static isXML(content: string): boolean {
    if (!content.includes('<') || !content.includes('>')) return false;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/xml');
      return !doc.querySelector('parsererror');
    } catch {
      return false;
    }
  }

  private static isYAML(content: string): boolean {
    const yamlPattern = /^[a-zA-Z_][a-zA-Z0-9_]*:\s*.+$/m;
    const hasYamlStructure = yamlPattern.test(content);
    const hasIndentation = /^\s+/.test(content);
    return hasYamlStructure || (hasIndentation && content.includes(':'));
  }

  private static isSQL(content: string): boolean {
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
    const upperContent = content.toUpperCase();
    return sqlKeywords.some((keyword) => upperContent.includes(keyword));
  }

  private static isJavaScript(content: string): boolean {
    const jsPatterns = [
      /function\s+\w+\s*\(/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /=>\s*{/,
      /console\.log\(/,
      /require\(/,
      /import\s+/,
      /export\s+/,
    ];
    return jsPatterns.some((pattern) => pattern.test(content));
  }

  private static isCron(content: string): boolean {
    const cronPattern =
      /^([0-5]?\d|\*|\/\d+|\d+-\d+)(,([0-5]?\d|\*|\/\d+|\d+-\d+))*\s+([01]?\d|2[0-3]|\*|\/\d+|\d+-\d+)(,([01]?\d|2[0-3]|\*|\/\d+|\d+-\d+))*\s+([0-2]?\d|3[01]|\*|\/\d+|\d+-\d+)(,([0-2]?\d|3[01]|\*|\/\d+|\d+-\d+))*\s+([0]?\d|1[0-2]|\*|\/\d+|\d+-\d+)(,([0]?\d|1[0-2]|\*|\/\d+|\d+-\d+))*\s+([0-6]|\*|\/\d+|\d+-\d+)(,([0-6]|\*|\/\d+|\d+-\d+))*$/;
    return cronPattern.test(content.trim());
  }

  private static isCSV(content: string): boolean {
    const lines = content.split('\n');
    if (lines.length < 2) return false;

    const commaCount = lines[0].split(',').length;
    if (commaCount < 2) return false;

    return lines.slice(0, 3).every((line) => line.split(',').length === commaCount);
  }

  private static isMarkdown(content: string): boolean {
    const mdPatterns = [
      /^#{1,6}\s+.+$/m,
      /\*\*.*\*\*/,
      /\*.*\*/,
      /`.*`/,
      /\[.*\]\(.*\)/,
      /^[-*+]\s+/m,
      /^\d+\.\s+/m,
    ];
    return mdPatterns.some((pattern) => pattern.test(content));
  }

  private static isCURL(content: string): boolean {
    return content.startsWith('curl ') || content.includes('curl ');
  }

  private static isPHPSerialized(content: string): boolean {
    const phpSerializedPattern = /^[aoisdbN]:[0-9]+:/;
    return phpSerializedPattern.test(content);
  }

  private static isColor(content: string): boolean {
    const colorPatterns = [
      /^#[0-9a-fA-F]{3,8}$/,
      /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
      /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[01]?(\.\d+)?\s*\)$/,
      /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/,
      /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[01]?(\.\d+)?\s*\)$/,
    ];
    return colorPatterns.some((pattern) => pattern.test(content.trim()));
  }

  private static isRegex(content: string): boolean {
    if (content.length < 3) return false;
    return (
      (content.startsWith('/') && content.lastIndexOf('/') > 0) ||
      content.includes('\\d') ||
      content.includes('\\w') ||
      content.includes('\\s') ||
      content.includes('[a-z]') ||
      content.includes('.*') ||
      content.includes('.+')
    );
  }

  private static isNumber(content: string): boolean {
    return !isNaN(Number(content)) && content.trim() !== '';
  }
}
