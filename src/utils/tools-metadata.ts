import { allTools, Tool } from "./tools-data";

export interface ToolMetadata {
  toolId: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  usage: string[];
  category: string;
  url: string;
  slug: string;
}

export type ToolWithMetadata = Tool & { metadata: ToolMetadata };

const metadataMap: Record<string, Omit<ToolMetadata, "toolId" | "title" | "shortDescription" | "category" | "url" | "slug">> = {
  "screenshot-studio": {
    longDescription: "Create polished screenshots locally: capture a window or screen, paste or drop images, annotate, redact, crop and add backgrounds. Save flattened results to Capture Library or export directly.",
    features: ["Screen and window capture with countdown", "Arrows, shapes, text, steps and freehand drawing", "Opaque redaction, crop, undo and redo", "Gradients, patterns, custom photos, shadows and browser frames", "Aspect ratios, alignment and saved style presets", "PNG, JPEG and WebP export at multiple scales"],
    usage: ["Choose a capture source or import/paste an image", "Drag on the canvas to annotate or crop", "Choose a background, frame and layout", "Export, copy, pin or save to Capture Library"],
  },
  "screen-recorder": {
    longDescription: "Record a screen, window or rectangular area with microphone, Windows system audio and a webcam bubble. Recordings are written incrementally to disk and continue when switching tools.",
    features: ["Screen, window and region recording", "Optional microphone and Windows system audio", "Circular webcam overlay", "15, 30 and 60 FPS with configurable bitrate", "Countdown, pause/resume and global stop shortcuts", "Persistent disk-backed recording library"],
    usage: ["Choose a screen or window", "Set audio, camera, quality and countdown", "Record, pause if needed, and stop", "Open the saved recording in Video Editor"],
  },
  "video-editor": {
    longDescription: "Turn recordings into clear walkthroughs with precise trimming, speed and audio controls, a guided zoom segment and presentation backgrounds. Real FFmpeg exports preserve your original files.",
    features: ["Trim start/end with frame stepping and playhead", "0.5x to 2x playback speed and audio gain", "Guided zoom with selectable focus and smooth easing", "Background color and padding", "MP4, WebM and animated GIF export", "Progress, cancellation and still-frame extraction"],
    usage: ["Import a video or choose a library recording", "Set trim points and preview the selection", "Adjust zoom, audio, speed and background", "Export to the library and download or share"],
  },
  "capture-library": {
    longDescription: "Find and reuse screenshots and recordings saved on your device. Optional Capture Cloud sharing requires a configured server and uploads only the selected file, with expiring links, passwords and revocation.",
    features: ["Persistent local capture history", "Search, media filters, preview and rename", "Download, copy images and pin above other windows", "Direct handoff to screenshot and video editors", "Optional cloud upload with 1, 7 or 30 day links", "Password protection, link revocation and OS credential storage"],
    usage: ["Save captures from Screenshot Studio or Screen Recorder", "Search and preview files in the library", "Edit, rename, copy, pin or download", "Optionally configure Capture Cloud and explicitly upload a selected capture"],
  },
  "pc-maintenance": {
    longDescription: "Local maintenance dashboard for storage, temporary files and startup registrations.",
    features: ["Local drive capacity", "Cleanup preview", "Startup registration summary"],
    usage: ["Open a maintenance tool", "Scan to inspect your computer", "Review results before making changes"],
  },
  "disk-space-analyzer": {
    longDescription: "Analyze a selected folder or drive, inspect immediate folder totals and find the largest files without modifying them.",
    features: ["Folder size breakdown", "Largest files", "Search and sort", "Progress and cancellation", "Show in Explorer"],
    usage: ["Choose a folder", "Wait for the scan or stop it to see partial results", "Filter results and open a file location"],
  },
  "temporary-file-cleaner": {
    longDescription: "Preview Windows and user temporary files last modified at least seven days ago and permanently delete selected categories after confirmation.",
    features: ["Scan before deleting", "Category selection", "Changed-file protection", "Partial failure reporting"],
    usage: ["Scan temporary files", "Preview and select categories", "Confirm permanent deletion", "Review the cleanup report"],
  },
  "startup-manager": {
    longDescription: "Review Run entries and Startup folders. Disable personal registrations and restore their original values; shared entries are read-only.",
    features: ["Registry and Startup folder inventory", "Reversible personal changes", "Preserved commands and registry types", "Windows settings shortcut"],
    usage: ["Load startup apps", "Review name, command and source", "Disable or restore a personal entry", "Use Windows settings for effective startup status"],
  },
  "smart-file-renamer": {
    longDescription: "Rename and organize real files using reusable naming templates, local AI through Ollama or LM Studio, editable previews and reversible history. Read documents and scanned PDFs with a vision model, watch incoming folders, search extracted text and compare exact duplicates locally.",
    features: ["Bulk rename with editable preview and preserved extensions", "Saved naming presets and custom extraction fields", "Ollama and LM Studio on localhost", "PDF text extraction and scanned PDF/image analysis with a vision model", "Office, OpenDocument, EPUB and text file extraction", "Ordered organization rules with relative destination folders", "Persistent watch folders with review or automatic mode", "Content search and SHA-256 exact duplicate comparison", "Durable operation history and protected undo", "Collision checks, cancellation and per-file errors", "Metadata naming without an AI server", "CSV export of extracted fields and rename history"],
    usage: ["Add files or a folder, or drag files into the library", "Choose a naming preset; configure a local model for content-based names", "Analyze files and review names, missing fields and destination folders", "Select files and apply the preview; use History to undo", "Optionally watch a folder and choose review or automatic mode"],
  },
  "uuid-validator": {
    longDescription: "Validate and inspect UUIDs locally, including versions 1-8, Nil, and Max. Detect formatting errors, identify variants, extract supported timestamps, and copy normalized representations.",
    features: ["Instant format, version, and variant validation", "Canonical, compact, uppercase, braced GUID, and URN input", "UUID versions 1-8 plus Nil and Max", "UTC timestamp extraction for v1, v6, and v7", "Node and clock sequence inspection for v1 and v6", "Normalized formats and JSON report copying", "Examples, clear action, and persistent input"],
    usage: ["Paste a UUID or load an example", "Review validation errors or UUID details", "Inspect any embedded timestamp, node, and clock sequence", "Copy a normalized UUID or the JSON report"],
  },
  "dummy-data-generator": {
    longDescription: "Generate realistic sample data for testing and development. Supports multiple data types including names, emails, addresses, dates, and custom schemas.",
    features: ["Multiple data type generators", "Customizable output format (JSON, CSV, SQL)", "Bulk generation with configurable count", "Faker.js powered realistic data"],
    usage: ["Select the data types you need", "Configure the number of records", "Choose output format", "Click Generate and copy the result"],
  },
  "encode--decode-tools": {
    longDescription: "A comprehensive suite of encoding, hashing, and encryption tools. Supports multiple algorithms and formats for string transformation.",
    features: ["Base64, URL, HTML entity encoding", "MD5, SHA-1, SHA-256, SHA-512 hashing", "AES, DES encryption/decryption", "Real-time encoding as you type"],
    usage: ["Select the encoding/hashing algorithm", "Enter your text in the input field", "View the result instantly", "Copy the output with one click"],
  },
  "yaml-to-json": {
    longDescription: "Convert YAML (YAML Ain't Markup Language) documents to JSON format with support for complex nested structures and formatting options.",
    features: ["Real-time YAML to JSON conversion", "Configurable indentation (2/4 spaces)", "Support for complex nested structures", "Error highlighting for invalid YAML"],
    usage: ["Paste your YAML content in the left panel", "Adjust indentation settings if needed", "View the JSON output in the right panel", "Copy the result to clipboard"],
  },
  "json-to-yaml": {
    longDescription: "Convert JSON data to YAML format with customizable indentation. Produces clean, human-readable YAML output from structured JSON input.",
    features: ["Real-time JSON to YAML conversion", "Configurable indentation (2/3/4/8 spaces)", "Support for arrays and nested objects", "Error highlighting for invalid JSON"],
    usage: ["Paste your JSON content in the left panel", "Select indentation level", "View the YAML output in the right panel", "Copy the result to clipboard"],
  },
  "json-formatvalidate": {
    longDescription: "Format, validate, and beautify JSON data. Supports JSONPath queries for extracting specific data from JSON structures.",
    features: ["JSON formatting and beautification", "JSON validation with error messages", "JSONPath query support", "Configurable indentation"],
    usage: ["Paste your JSON in the input editor", "Select indentation level", "Use JSONPath to query specific data", "Copy formatted output"],
  },
  "json-schema-validator": {
    longDescription: "Validate JSON data against JSON Schema definitions using the Ajv library. Supports draft-07 and earlier versions with detailed error reporting.",
    features: ["JSON Schema draft-07 support", "Real-time validation as you type", "Detailed error messages with paths", "Schema formatting and prettifying"],
    usage: ["Enter your JSON Schema in the left panel", "Enter data to validate in the right panel", "View validation results instantly", "Use Format to prettify schema"],
  },
  "unix-time-converter": {
    longDescription: "Convert between Unix timestamps and human-readable date formats. Supports milliseconds and provides code snippets in multiple programming languages.",
    features: ["Unix to date and date to Unix conversion", "Milliseconds support", "Code snippets for 10+ languages", "Current timestamp display"],
    usage: ["Enter a Unix timestamp or select a date", "View the converted result", "Copy code snippets for your language", "Use the current time button for now"],
  },
  "jwt-debugger": {
    longDescription: "Debug and verify JSON Web Tokens (JWT). Decode header and payload, verify signatures, and inspect token claims.",
    features: ["JWT decoding and verification", "Header and payload inspection", "Signature verification", "Token expiration checking"],
    usage: ["Paste your JWT token", "View decoded header, payload, and signature", "Enter secret to verify signature", "Copy individual sections"],
  },
  "jwt-builder": {
    longDescription: "Create and sign JSON Web Tokens (JWT) for authentication and authorization with support for multiple algorithms.",
    features: ["HS256, HS384, HS512 signing", "Customizable payload claims", "Pre-built standard claims (exp, nbf, iat, jti)", "Real-time token generation"],
    usage: ["Select signing algorithm", "Enter a secret key", "Add or modify claims", "Click Generate Token"],
  },
  "color-converter": {
    longDescription: "Convert colors between multiple formats including HEX, RGB, RGBA, HSL, HSLA, HSB, HWB, and CMYK with a visual color picker.",
    features: ["Support for 9 color formats", "Visual color picker", "Real-time conversion", "Copy individual format values"],
    usage: ["Enter a color in any supported format", "Use the color picker for visual selection", "View all format conversions", "Copy any format value"],
  },
  "base64-string-encoderdecoder": {
    longDescription: "Encode and decode strings to/from Base64 format. Supports UTF-8 text encoding and provides real-time conversion.",
    features: ["String to Base64 encoding", "Base64 to string decoding", "UTF-8 support", "Real-time conversion"],
    usage: ["Paste text or Base64 in the input", "Select encode or decode mode", "View the result instantly", "Copy the output"],
  },
  "base64-image-encoderdecoder": {
    longDescription: "Convert images to Base64 data URIs and decode Base64 strings back to images. Supports common image formats.",
    features: ["Image to Base64 encoding", "Base64 to image preview", "Data URI generation", "Support for PNG, JPEG, GIF, SVG"],
    usage: ["Upload an image or paste Base64", "View the encoded/decoded result", "Copy the Base64 string", "Preview decoded images"],
  },
  "regex-tester": {
    longDescription: "Test and debug regular expressions with real-time matching, highlighting, and detailed match information.",
    features: ["Real-time regex matching", "Match highlighting", "Capture group display", "Flag support (g, i, m, s)"],
    usage: ["Enter your regex pattern", "Set flags as needed", "Enter test text", "View matches and groups"],
  },
  "url-encoderdecoder": {
    longDescription: "Encode and decode URLs using percent-encoding. Handles special characters and supports full URL or component encoding.",
    features: ["URL encoding and decoding", "Component-level encoding", "Special character handling", "Real-time conversion"],
    usage: ["Paste your URL or text", "Select encode or decode", "View the result", "Copy the output"],
  },
  "url-parser": {
    longDescription: "Parse and analyze URL components including protocol, host, path, query parameters, and hash fragments.",
    features: ["Full URL component breakdown", "Query parameter parsing", "Hash fragment extraction", "Copy individual components"],
    usage: ["Paste a URL", "View all parsed components", "Expand query parameters", "Copy specific parts"],
  },
  "html-entity-encoderdecoder": {
    longDescription: "Convert special characters to HTML entities and vice versa. Supports named and numeric entity formats.",
    features: ["HTML entity encoding", "HTML entity decoding", "Named and numeric entities", "Real-time conversion"],
    usage: ["Paste text or HTML entities", "Select encode or decode", "View the result", "Copy the output"],
  },
  "backslash-escapeunescape": {
    longDescription: "Escape and unescape special characters using backslash notation. Useful for string literals in code.",
    features: ["Backslash escaping", "Unescape support", "Special character handling", "Real-time conversion"],
    usage: ["Paste your text", "Select escape or unescape", "View the result", "Copy the output"],
  },
  "html-beautifyminify": {
    longDescription: "Format and minify HTML code with configurable indentation. Supports both beautification and compression.",
    features: ["HTML beautification", "HTML minification", "Configurable indentation", "Preserve line breaks option"],
    usage: ["Paste your HTML code", "Select beautify or minify", "Choose indentation", "Copy formatted output"],
  },
  "css-beautifyminify": {
    longDescription: "Format and minify CSS code with configurable options. Supports both beautification and compression.",
    features: ["CSS beautification", "CSS minification", "Configurable indentation", "Selector formatting options"],
    usage: ["Paste your CSS code", "Select beautify or minify", "Choose indentation", "Copy formatted output"],
  },
  "javascript-beautifyminify": {
    longDescription: "Format and minify JavaScript code with support for ES6+ syntax and configurable formatting options.",
    features: ["JavaScript beautification", "JavaScript minification", "ES6+ syntax support", "Configurable options"],
    usage: ["Paste your JavaScript code", "Select beautify or minify", "Choose formatting options", "Copy the result"],
  },
  "xml-json-converter": {
    longDescription: "Convert between XML and JSON formats with support for attributes, arrays, and custom root elements.",
    features: ["XML to JSON conversion", "JSON to XML conversion", "Attribute support", "Custom root element naming"],
    usage: ["Select conversion direction", "Paste input in the left panel", "View output in the right panel", "Use Format to prettify"],
  },
  "xml-beautifyminify": {
    longDescription: "Format and minify XML documents with proper indentation and tag formatting.",
    features: ["XML beautification", "XML minification", "Tag indentation", "Attribute formatting"],
    usage: ["Paste your XML code", "Select beautify or minify", "View formatted output", "Copy the result"],
  },
  "less-beautifyminify": {
    longDescription: "Format and minify LESS stylesheets with configurable indentation and formatting options.",
    features: ["LESS beautification", "LESS minification", "Variable formatting", "Mixin support"],
    usage: ["Paste your LESS code", "Select beautify or minify", "Choose indentation", "Copy formatted output"],
  },
  "scss-beautifyminify": {
    longDescription: "Format and minify SCSS/Sass code with support for variables, mixins, and nested selectors.",
    features: ["SCSS beautification", "SCSS minification", "Nested selector support", "Variable formatting"],
    usage: ["Paste your SCSS code", "Select beautify or minify", "Choose indentation", "Copy formatted output"],
  },
  "erb-beautifyminify": {
    longDescription: "Format and minify ERB (Embedded Ruby) templates with proper indentation of Ruby and HTML.",
    features: ["ERB beautification", "ERB minification", "Ruby tag formatting", "HTML indentation"],
    usage: ["Paste your ERB code", "Select beautify or minify", "Choose indentation", "Copy formatted output"],
  },
  "sql-formatter": {
    longDescription: "Format SQL queries with configurable dialect support and indentation options for improved readability.",
    features: ["SQL beautification", "Multiple SQL dialect support", "Configurable indentation", "Keyword capitalization"],
    usage: ["Paste your SQL query", "Select SQL dialect", "Choose formatting options", "Copy formatted output"],
  },
  "sql-json-converter": {
    longDescription: "Convert SQL CREATE TABLE statements to JSON schema and vice versa. Also supports SQL formatting.",
    features: ["SQL to JSON conversion", "JSON to SQL conversion", "SQL formatting", "Column type mapping"],
    usage: ["Select conversion direction", "Enter SQL or JSON", "View converted output", "Copy the result"],
  },
  "typescript-to-javascript": {
    longDescription: "Convert TypeScript code to JavaScript using the Sucrase transpiler. Strips type annotations and transforms syntax.",
    features: ["TypeScript to JavaScript conversion", "Type annotation removal", "JSX support", "Real-time transpilation"],
    usage: ["Paste TypeScript code in the left panel", "View JavaScript output in the right panel", "Copy the result", "Use Sample for example code"],
  },
  "javascript-obfuscator": {
    longDescription: "Obfuscate JavaScript code to protect source code from reverse engineering with multiple protection levels.",
    features: ["Variable name obfuscation", "String encoding and encryption", "Control flow flattening", "Dead code injection", "Anti-debugger protection"],
    usage: ["Paste JavaScript code", "Configure obfuscation options", "Click Obfuscate", "Copy protected code"],
  },
  "ipv4ipv6-validator": {
    longDescription: "Validate IPv4 and IPv6 addresses with detailed information about address type and format.",
    features: ["IPv4 validation", "IPv6 validation", "Address type detection", "Format information"],
    usage: ["Enter an IP address", "View validation result", "See address type details"],
  },
  "http-status-codes-reference": {
    longDescription: "Browse and search HTTP status codes with descriptions, categories, and usage examples.",
    features: ["Complete HTTP status code list", "Category filtering", "Search functionality", "Detailed descriptions"],
    usage: ["Browse status codes by category", "Search for specific codes", "Click a code for details"],
  },
  "mime-types-reference": {
    longDescription: "Browse and search MIME types with file extensions and categories for web development reference.",
    features: ["Complete MIME type database", "Category filtering", "Extension mapping", "Search functionality"],
    usage: ["Browse by category", "Search for file extensions", "Find MIME type for a format"],
  },
  "rest-api-tester": {
    longDescription: "Test REST API endpoints with support for different HTTP methods, headers, and request bodies.",
    features: ["GET, POST, PUT, DELETE support", "Custom headers", "JSON request body", "Response inspection"],
    usage: ["Enter the API URL", "Select HTTP method", "Add headers and body", "Send request and view response"],
  },
  "line-sortdedupe": {
    longDescription: "Sort lines alphabetically or numerically and remove duplicate lines from text content.",
    features: ["Alphabetical sorting", "Numerical sorting", "Duplicate removal", "Case-sensitive options"],
    usage: ["Paste your text", "Choose sort method", "Toggle deduplicate option", "Copy sorted output"],
  },
  "hex-to-ascii": {
    longDescription: "Convert hexadecimal strings to ASCII text with support for various hex formats and delimiters.",
    features: ["Hex to ASCII conversion", "Multiple delimiter support", "Format detection", "Real-time conversion"],
    usage: ["Paste hex string", "Select delimiter format", "View ASCII output", "Copy the result"],
  },
  "ascii-to-hex": {
    longDescription: "Convert ASCII text to hexadecimal representation with configurable delimiter and formatting options.",
    features: ["ASCII to hex conversion", "Configurable delimiters", "Uppercase/lowercase output", "Real-time conversion"],
    usage: ["Enter ASCII text", "Choose output format", "View hex output", "Copy the result"],
  },
  "html-preview": {
    longDescription: "Write HTML code and preview it in real-time with a live rendering pane alongside the code editor.",
    features: ["Real-time HTML preview", "Side-by-side editor and preview", "Full HTML document support", "Isolated rendering"],
    usage: ["Write or paste HTML code", "View live preview on the right", "Use sample for starter code", "Copy your HTML code"],
  },
  "markdown-preview": {
    longDescription: "Write Markdown and preview it in real-time with support for GFM, math equations, and syntax highlighting.",
    features: ["Real-time Markdown rendering", "GitHub Flavored Markdown", "Math equation support", "Code syntax highlighting"],
    usage: ["Write or paste Markdown", "View rendered preview", "Use sample for example content", "Copy your Markdown"],
  },
  "html-to-jsx": {
    longDescription: "Convert HTML code to JSX for use in React components. Handles attribute renaming and self-closing tags.",
    features: ["HTML to JSX conversion", "Attribute renaming (class to className)", "Self-closing tag handling", "Style object conversion"],
    usage: ["Paste HTML code", "View JSX output", "Copy converted JSX", "Use in React components"],
  },
  "json-to-csv": {
    longDescription: "Convert JSON arrays or objects to CSV format with configurable delimiter and header options.",
    features: ["JSON to CSV conversion", "Configurable delimiter", "Header row support", "Nested object flattening"],
    usage: ["Paste JSON data", "Configure CSV options", "View CSV output", "Copy or download result"],
  },
  "csv-to-json": {
    longDescription: "Convert CSV data to JSON format with header detection and configurable parsing options.",
    features: ["CSV to JSON conversion", "Header detection", "Configurable delimiter", "Type inference"],
    usage: ["Paste CSV data", "Configure parsing options", "View JSON output", "Copy the result"],
  },
  "csv-tsv-converter": {
    longDescription: "Convert between CSV (Comma Separated Values) and TSV (Tab Separated Values) formats with header support.",
    features: ["CSV to TSV conversion", "TSV to CSV conversion", "Header row toggle", "Data validation"],
    usage: ["Select conversion direction", "Paste your data", "Toggle header option", "Copy converted output"],
  },
  "excel-jsoncsv-converter": {
    longDescription: "Convert between Excel files (XLSX, XLS) and JSON/CSV formats with multi-sheet support.",
    features: ["Excel to JSON conversion", "Excel to CSV conversion", "JSON/CSV to Excel", "Multi-sheet support"],
    usage: ["Select conversion direction", "Upload Excel or paste data", "Choose sheet if applicable", "Download or copy result"],
  },
  "json-to-code": {
    longDescription: "Convert JSON data to typed code in multiple programming languages including TypeScript, Python, Go, and more.",
    features: ["Multiple language support", "Type inference", "Class/interface generation", "Customizable model names"],
    usage: ["Paste JSON data", "Select target language", "Set model name", "Copy generated code"],
  },
  "curl-to-code": {
    longDescription: "Convert cURL commands to code in multiple programming languages for easy API integration.",
    features: ["Multiple language output", "Header parsing", "Body parsing", "Authentication support"],
    usage: ["Paste a cURL command", "Select target language", "View converted code", "Copy the result"],
  },
  "string-case-converter": {
    longDescription: "Convert text between multiple case formats including camelCase, PascalCase, snake_case, kebab-case, and more.",
    features: ["Multiple case formats", "Real-time conversion", "Batch conversion", "Custom separator support"],
    usage: ["Paste your text", "View all case conversions", "Copy the desired format", "Use for variable naming"],
  },
  "random-string-generator": {
    longDescription: "Generate random strings with configurable length, character sets, and format options for passwords and tokens.",
    features: ["Configurable length", "Character set selection", "Multiple string generation", "Copy to clipboard"],
    usage: ["Set string length", "Choose character types", "Set number of strings", "Generate and copy"],
  },
  "php-serializer": {
    longDescription: "Serialize data to PHP serialized format for cross-platform data exchange with PHP applications.",
    features: ["JSON to PHP serialize", "Support for arrays and objects", "Type preservation", "Real-time conversion"],
    usage: ["Paste JSON data", "View PHP serialized output", "Copy the result", "Use in PHP applications"],
  },
  "php-deserializer": {
    longDescription: "Deserialize PHP serialized strings to JSON format for inspection and data analysis.",
    features: ["PHP unserialize to JSON", "Nested structure support", "Type detection", "Error handling"],
    usage: ["Paste PHP serialized string", "View JSON output", "Copy the result", "Inspect data structure"],
  },
  "php-to-json": {
    longDescription: "Convert PHP array syntax to JSON format for cross-language data exchange.",
    features: ["PHP array to JSON", "Nested array support", "Type conversion", "Real-time conversion"],
    usage: ["Paste PHP array code", "View JSON output", "Copy the result"],
  },
  "json-to-php": {
    longDescription: "Convert JSON data to PHP array syntax for use in PHP applications.",
    features: ["JSON to PHP array", "Nested structure support", "Type mapping", "Real-time conversion"],
    usage: ["Paste JSON data", "View PHP array output", "Copy the result", "Use in PHP code"],
  },
  "certificate-decoder": {
    longDescription: "Decode and inspect X.509 certificates in PEM format to view issuer, subject, validity, and extensions.",
    features: ["PEM certificate decoding", "Issuer/subject display", "Validity period checking", "Extension inspection"],
    usage: ["Paste PEM certificate", "View decoded information", "Check validity dates", "Copy specific fields"],
  },
  "cron-job-parser": {
    longDescription: "Parse and understand cron expressions with human-readable descriptions of schedule timing.",
    features: ["Cron expression parsing", "Human-readable output", "Field-by-field breakdown", "Copy individual fields"],
    usage: ["Enter a cron expression", "View parsed schedule", "Read human-readable description", "Copy fields as needed"],
  },
  "qr-code-readergenerator": {
    longDescription: "Generate QR codes from text/URLs and read QR codes from uploaded images.",
    features: ["QR code generation", "QR code reading from images", "Customizable size", "Download as image"],
    usage: ["Enter text or URL to generate", "Upload image to read QR code", "Download generated QR code"],
  },
  "image-optimizer": {
    longDescription: "Optimize and compress images while maintaining quality. Supports multiple formats and bulk processing.",
    features: ["Image compression", "Format conversion", "Quality control", "Bulk processing"],
    usage: ["Upload images", "Set compression quality", "Choose output format", "Download optimized images"],
  },
  "lorem-ipsum-generator": {
    longDescription: "Generate placeholder Lorem Ipsum text in various formats including paragraphs, sentences, and words.",
    features: ["Paragraph generation", "Sentence generation", "Word generation", "Configurable count"],
    usage: ["Select generation type", "Set count", "Generate text", "Copy the result"],
  },
  "svg-to-css": {
    longDescription: "Convert SVG code to CSS background-image data URI for inline use in stylesheets.",
    features: ["SVG to CSS data URI", "URL encoding", "Background-image generation", "Real-time conversion"],
    usage: ["Paste SVG code", "View CSS output", "Copy the CSS property", "Use in your stylesheet"],
  },
  "css-to-svg": {
    longDescription: "Extract SVG content from CSS data URIs and background-image properties.",
    features: ["CSS data URI to SVG", "URL decoding", "SVG extraction", "Real-time conversion"],
    usage: ["Paste CSS with SVG data URI", "View extracted SVG", "Copy the SVG code", "Use in your markup"],
  },
  "number-base-converter": {
    longDescription: "Convert numbers between different bases including binary, octal, decimal, and hexadecimal.",
    features: ["Binary, octal, decimal, hex conversion", "Custom base support", "Real-time conversion", "Copy individual values"],
    usage: ["Enter a number", "Select input base", "View all base conversions", "Copy desired format"],
  },
  "discord-timestamp": {
    longDescription: "Generate Discord-formatted timestamps that display in the viewer's local timezone.",
    features: ["Multiple timestamp formats", "Date/time picker", "Preview display", "Copy formatted timestamp"],
    usage: ["Select date and time", "Choose timestamp format", "Preview the display", "Copy Discord markup"],
  },
  "text-diff-checker": {
    longDescription: "Compare two text blocks and highlight differences with line-by-line or character-by-character comparison.",
    features: ["Side-by-side comparison", "Line-level diffing", "Change highlighting", "Unified diff view"],
    usage: ["Paste original text on the left", "Paste modified text on the right", "View highlighted differences", "Toggle diff modes"],
  },
  "characterword-counter": {
    longDescription: "Count characters, words, lines, sentences, paragraphs, and more with detailed text statistics and frequency analysis.",
    features: ["Character count (with/without spaces)", "Word count", "Sentence and paragraph counting", "Reading/speaking time", "Word and character frequency"],
    usage: ["Paste or type your text", "View real-time statistics", "Toggle counting modes", "Analyze word frequency"],
  },
  "ini-parser": {
    longDescription: "Parse and convert INI configuration files to JSON and vice versa with support for sections and comments.",
    features: ["INI to JSON conversion", "JSON to INI conversion", "Section support", "Comment handling"],
    usage: ["Select conversion direction", "Paste INI or JSON", "View converted output", "Copy the result"],
  },
  "toml-parser": {
    longDescription: "Parse and convert TOML (Tom's Obvious, Minimal Language) to JSON and vice versa with full data type support.",
    features: ["TOML to JSON conversion", "JSON to TOML conversion", "All TOML data types", "Configurable indentation"],
    usage: ["Select conversion direction", "Paste TOML or JSON", "View converted output", "Copy the result"],
  },
  "code-comments-remover": {
    longDescription: "Remove comments from source code in multiple programming languages while preserving code structure.",
    features: ["Multi-language support", "Single-line comment removal", "Multi-line comment removal", "Code preservation"],
    usage: ["Select programming language", "Paste code with comments", "View code without comments", "Copy cleaned code"],
  },
  "ascii-art-generator": {
    longDescription: "Generate ASCII art text from input using various FIGlet fonts for creative text display.",
    features: ["Multiple font support", "Real-time generation", "FIGlet font library", "Copy to clipboard"],
    usage: ["Enter your text", "Select a font", "View ASCII art output", "Copy the result"],
  },
  "unit-converter": {
    longDescription: "Convert between various units of measurement including length, weight, temperature, and more.",
    features: ["Multiple unit categories", "Real-time conversion", "Swap units", "Common unit presets"],
    usage: ["Select unit category", "Enter a value", "Choose from/to units", "View converted result"],
  },
  "bmi-calculator": {
    longDescription: "Calculate Body Mass Index (BMI) with support for metric and imperial units and health category display.",
    features: ["BMI calculation", "Metric and imperial units", "Health category display", "Visual result indicator"],
    usage: ["Select unit system", "Enter height and weight", "View BMI result", "See health category"],
  },
  "world-clock": {
    longDescription: "View current time in multiple time zones around the world with customizable timezone list.",
    features: ["Multiple timezone display", "Add/remove timezones", "Real-time updates", "12/24 hour format"],
    usage: ["View default timezones", "Add new timezones", "Remove unwanted clocks", "Watch real-time updates"],
  },
  "stopwatch": {
    longDescription: "A precise stopwatch with lap time tracking and time splitting functionality.",
    features: ["Start/stop/reset", "Lap time recording", "Split time tracking", "Copy lap times"],
    usage: ["Click Start to begin", "Click Lap to record times", "Click Stop to pause", "Reset to clear"],
  },
  "text-statistics-analyzer": {
    longDescription: "Analyze text with detailed statistics including readability scores, word frequency, and structural analysis.",
    features: ["Readability scoring", "Word frequency analysis", "Structural statistics", "Character distribution"],
    usage: ["Paste your text", "View comprehensive statistics", "Analyze readability", "Check word frequency"],
  },
  "pomodoro-timer": {
    longDescription: "A Pomodoro technique timer with customizable work and break intervals for focused productivity.",
    features: ["Configurable work intervals", "Short and long break timers", "Session counting", "Audio notifications"],
    usage: ["Set work duration", "Set break duration", "Click Start", "Follow work/break cycles"],
  },
  "bad-vs-good-code": {
    longDescription: "A visual code comparison tool that renders side-by-side 'bad' vs 'good' code examples with neon glow effects. Input structured JSON to create beautiful code comparison cards.",
    features: ["Two-column bad/good comparison layout", "Neon glow effects (red bad, green good)", "Whitespace-preserving code display", "Line numbers", "VS Code-style dark theme containers", "Real-time JSON preview"],
    usage: ["Paste your comparison JSON in the input", "Mark chunks with glow: true to highlight", "View the rendered comparison below", "Use Sample button for a quick demo"],
  },
  "kanban-board": {
    longDescription: "A Trello-style drag-and-drop Kanban board for organizing tasks and projects. Create columns, add cards, and move them between states with intuitive drag & drop.",
    features: ["Drag & drop cards between columns", "Customizable columns (add/rename/delete)", "Color labels for cards", "Inline editing", "Persistent state", "Responsive layout"],
    usage: ["Create columns for your workflow stages", "Add cards with the + button", "Drag cards between columns", "Click cards to edit content"],
  },
  "port-kill": {
    longDescription: "A real-time port scanner and process terminator for developers. Shows all listening TCP ports with their associated processes and enables one-click termination. Auto-refreshes every 5 seconds.",
    features: ["Real-time port scanning with 5s auto-refresh", "Process name detection", "One-click kill with confirmation", "Filter by port or process name", "Sortable columns", "Known port labels (React, Vite, Node, etc.)", "Cross-platform (Windows, macOS, Linux)"],
    usage: ["Open the tool to see all listening ports", "Use the search to filter by port or process", "Click Kill to terminate a process", "Confirm the action in the dialog"],
  },
};

function getToolSlug(tool: Tool): string {
  return tool.url.replace(/^\//, "");
}

function buildMetadata(tool: Tool): ToolMetadata {
  const extra = metadataMap[tool.id];
  return {
    toolId: tool.id,
    title: tool.title,
    shortDescription: tool.description,
    longDescription: extra?.longDescription || tool.description,
    features: extra?.features || [],
    usage: extra?.usage || [],
    category: tool.category,
    url: tool.url,
    slug: getToolSlug(tool),
  };
}

export const allToolsMetadata: ToolMetadata[] = allTools.map(buildMetadata);

export const toolsMetadataMap: Record<string, ToolMetadata> = {};
for (const meta of allToolsMetadata) {
  toolsMetadataMap[meta.toolId] = meta;
  toolsMetadataMap[meta.slug] = meta;
}

export function getToolMetadata(
  toolIdOrSlug: string,
): ToolMetadata | undefined {
  return toolsMetadataMap[toolIdOrSlug];
}

export function getAllToolsWithMetadata(): ToolWithMetadata[] {
  return allTools.map((tool) => ({
    ...tool,
    metadata: buildMetadata(tool),
  }));
}
