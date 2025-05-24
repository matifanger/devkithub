import { ContentType, ToolRecommendation } from '../../types/clipboard';
import { allTools, Tool } from '../../utils/tools-data';

export class ToolRecommender {
  private static readonly contentTypeToToolMapping: Record<ContentType, string[]> = {
    json: ['JSON Format/Validate', 'JSON to YAML', 'JSON to CSV', 'JSON to Code', 'JSON to PHP'],
    yaml: ['YAML to JSON', 'JSON Format/Validate'],
    html: ['HTML Beautify/Minify', 'HTML Preview', 'HTML to JSX', 'HTML Entity Encoder/Decoder'],
    css: ['CSS Beautify/Minify', 'CSS to SVG'],
    javascript: ['JavaScript Beautify/Minify', 'HTML Preview'],
    xml: ['XML Beautify/Minify', 'HTML Beautify/Minify'],
    sql: ['SQL Formatter'],
    hex: ['Hex to ASCII', 'ASCII to Hex', 'Number Base Converter'],
    base64: ['Base64 String Encoder/Decoder', 'Base64 Image Encoder/Decoder'],
    url: ['URL Encoder/Decoder', 'URL Parser'],
    jwt: ['JWT Debugger'],
    'unix-timestamp': ['Unix Time Converter'],
    regex: ['Regex Tester'],
    cron: ['Cron Job Parser'],
    csv: ['CSV to JSON', 'JSON to CSV'],
    markdown: ['Markdown Preview'],
    curl: ['CURL to Code'],
    'php-serialized': ['PHP Deserializer', 'PHP to JSON'],
    color: ['Color Converter'],
    number: ['Number Base Converter', 'Unix Time Converter'],
    text: [
      'String Case Converter',
      'Random String Generator',
      'Lorem Ipsum Generator',
      'Line Sort/Dedupe',
    ],
    unknown: [],
  };

  /**
   * Get tool recommendations based on content type
   */
  static getRecommendations(contentType: ContentType, confidence: number): ToolRecommendation[] {
    const toolTitles = this.contentTypeToToolMapping[contentType] || [];

    if (toolTitles.length === 0 || confidence < 0.3) {
      return [];
    }

    const recommendations: ToolRecommendation[] = [];

    toolTitles.forEach((title, index) => {
      const tool = allTools.find((t) => t.title === title);
      if (tool) {
        const relevanceScore = this.calculateRelevanceScore(confidence, index, toolTitles.length);
        const reason = this.getRecommendationReason(contentType, tool.title);

        recommendations.push({
          toolId: tool.id,
          relevanceScore,
          reason,
        });
      }
    });

    // Sort by relevance score (highest first)
    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get recommended tools (Tool objects) based on content type
   */
  static getRecommendedTools(contentType: ContentType, confidence: number): Tool[] {
    const recommendations = this.getRecommendations(contentType, confidence);

    return recommendations
      .slice(0, 3) // Limit to top 3 recommendations
      .map((rec) => allTools.find((tool) => tool.id === rec.toolId))
      .filter((tool) => tool !== undefined) as Tool[];
  }

  private static calculateRelevanceScore(
    confidence: number,
    index: number,
    totalTools: number
  ): number {
    // Base score from confidence
    let score = confidence;

    // Reduce score based on position in list (first tools are more relevant)
    const positionPenalty = (index / (totalTools - 1)) * 0.3;
    score -= positionPenalty;

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  private static getRecommendationReason(contentType: ContentType, toolTitle: string): string {
    const reasons: Record<string, Record<string, string>> = {
      json: {
        'JSON Format/Validate': 'Format and validate your JSON data',
        'JSON to YAML': 'Convert JSON to YAML format',
        'JSON to CSV': 'Convert JSON data to CSV',
        'JSON to Code': 'Generate type definitions from JSON',
        'JSON to PHP': 'Convert JSON to PHP format',
      },
      yaml: {
        'YAML to JSON': 'Convert YAML to JSON format',
        'JSON Format/Validate': 'Validate YAML structure',
      },
      html: {
        'HTML Beautify/Minify': 'Format and beautify HTML code',
        'HTML Preview': 'Preview your HTML in real-time',
        'HTML to JSX': 'Convert HTML to React JSX',
        'HTML Entity Encoder/Decoder': 'Handle HTML entities',
      },
      css: {
        'CSS Beautify/Minify': 'Format and beautify CSS code',
        'CSS to SVG': 'Extract SVG from CSS data URI',
      },
      javascript: {
        'JavaScript Beautify/Minify': 'Format and beautify JavaScript code',
        'HTML Preview': 'Test JavaScript in HTML context',
      },
      xml: {
        'XML Beautify/Minify': 'Format and beautify XML',
        'HTML Beautify/Minify': 'Format XML-like markup',
      },
      sql: {
        'SQL Formatter': 'Format and beautify SQL queries',
      },
      hex: {
        'Hex to ASCII': 'Convert hexadecimal to ASCII text',
        'ASCII to Hex': 'Convert ASCII to hexadecimal',
        'Number Base Converter': 'Convert between number bases',
      },
      base64: {
        'Base64 String Encoder/Decoder': 'Decode Base64 string data',
        'Base64 Image Encoder/Decoder': 'Handle Base64 image data',
      },
      url: {
        'URL Encoder/Decoder': 'Encode/decode URL components',
        'URL Parser': 'Parse and analyze URL structure',
      },
      jwt: {
        'JWT Debugger': 'Debug and verify JWT token',
      },
      'unix-timestamp': {
        'Unix Time Converter': 'Convert Unix timestamp to readable date',
      },
      regex: {
        'Regex Tester': 'Test and debug regular expression',
      },
      cron: {
        'Cron Job Parser': 'Parse and explain cron expression',
      },
      csv: {
        'CSV to JSON': 'Convert CSV data to JSON',
        'JSON to CSV': 'Convert JSON back to CSV',
      },
      markdown: {
        'Markdown Preview': 'Preview Markdown content',
      },
      curl: {
        'CURL to Code': 'Convert cURL to code',
      },
      'php-serialized': {
        'PHP Deserializer': 'Deserialize PHP data',
        'PHP to JSON': 'Convert PHP to JSON',
      },
      color: {
        'Color Converter': 'Convert between color formats',
      },
      number: {
        'Number Base Converter': 'Convert number between bases',
        'Unix Time Converter': "Check if it's a timestamp",
      },
      text: {
        'String Case Converter': 'Change text case',
        'Random String Generator': 'Generate similar text',
        'Lorem Ipsum Generator': 'Generate placeholder text',
        'Line Sort/Dedupe': 'Sort and organize text lines',
      },
    };

    return reasons[contentType]?.[toolTitle] || `Process ${contentType} content`;
  }
}
