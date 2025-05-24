export type ContentType =
  | 'json'
  | 'yaml'
  | 'html'
  | 'css'
  | 'javascript'
  | 'xml'
  | 'sql'
  | 'hex'
  | 'base64'
  | 'url'
  | 'jwt'
  | 'unix-timestamp'
  | 'regex'
  | 'cron'
  | 'csv'
  | 'markdown'
  | 'curl'
  | 'php-serialized'
  | 'color'
  | 'number'
  | 'text'
  | 'unknown';

export interface ContentDetectionResult {
  type: ContentType;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface ToolRecommendation {
  toolId: string;
  relevanceScore: number;
  reason: string;
}
