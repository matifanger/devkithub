# Clipboard Content Detection & Tool Recommendations

This feature automatically detects the content in your clipboard and recommends relevant tools from the sidebar.

## Features

### Automatic Content Detection

The system can detect and classify the following content types:

- **JSON** - Valid JSON objects and arrays
- **YAML** - YAML configuration files and data
- **HTML** - HTML markup and tags
- **CSS** - CSS styles and selectors
- **JavaScript** - JS code patterns and syntax
- **XML** - XML documents and markup
- **SQL** - SQL queries and statements
- **Hexadecimal** - Hex-encoded data
- **Base64** - Base64-encoded strings
- **URLs** - Web addresses and links
- **JWT Tokens** - JSON Web Tokens
- **Unix Timestamps** - Unix time values
- **Regular Expressions** - Regex patterns
- **Cron Expressions** - Cron job schedules
- **CSV Data** - Comma-separated values
- **Markdown** - Markdown formatted text
- **cURL Commands** - HTTP request commands
- **PHP Serialized Data** - PHP serialized objects
- **Color Codes** - Hex, RGB, HSL color values
- **Numbers** - Numeric values
- **Plain Text** - General text content

### Smart Tool Recommendations

Based on the detected content type, the system recommends the most relevant tools:

#### JSON Content

- JSON Format/Validate
- JSON to YAML
- JSON to CSV
- JSON to Code
- JSON to PHP

#### Base64 Content

- Base64 String Encoder/Decoder
- Base64 Image Encoder/Decoder

#### URL Content

- URL Encoder/Decoder
- URL Parser

#### And many more...

## Settings & Configuration

### Enable/Disable Feature

You can control this feature from the **Profile & Settings** modal:

1. Click the **Welcome** button in the sidebar
2. Go to the **General** tab
3. Toggle **"Enable smart tool recommendations based on clipboard content"**

The setting is saved automatically and takes effect immediately.

## How It Works

### Detection Algorithm

1. **Content Analysis**: The system analyzes clipboard content using pattern matching and validation
2. **Confidence Scoring**: Each detection has a confidence score (0-1) indicating accuracy
3. **Priority Ranking**: Tools are ranked by relevance to the detected content type

### Automatic Updates

- **Window Focus**: Checks clipboard when window gains focus
- **Visibility Changes**: Updates when app becomes visible
- **Periodic Checks**: Refreshes every 30 seconds when active
- **Manual Refresh**: Click the refresh button for immediate update

## Privacy & Security

- **Local Processing**: All content detection happens locally in your browser
- **No Data Transmission**: Clipboard content is never sent to external servers
- **Graceful Fallbacks**: If clipboard access fails, the feature silently disables
- **User Control**: Can be completely disabled from settings

## Architecture

### Domain-Driven Structure

```
src/
├── types/clipboard.ts                    # Type definitions
├── constants/settings-keys.ts            # Configuration constants
├── services/clipboard/
│   ├── clipboard-detector.ts            # Content detection logic
│   ├── tool-recommender.ts             # Recommendation engine
│   └── index.ts                         # Service exports
├── hooks/
│   ├── use-clipboard-recommendations.ts # Main clipboard hook
│   └── use-clipboard-settings.ts       # Settings management hook
└── components/
    ├── sidebar/recommended-tools.tsx    # UI component
    └── profile/tabs/general-tab.tsx     # Settings UI
```

### Core Components

#### ClipboardDetector

- Analyzes clipboard content
- Returns content type and confidence score
- Uses pattern matching and validation

#### ToolRecommender

- Maps content types to relevant tools
- Calculates relevance scores
- Provides user-friendly reasons

#### useClipboardRecommendations Hook

- Manages clipboard monitoring
- Handles state updates
- Provides loading states
- Respects enabled/disabled setting

#### useClipboardSettings Hook

- Manages enable/disable state
- Persists settings to storage
- Provides toggle functionality

#### RecommendedTools Component

- Displays recommended tools
- Shows content type and confidence
- Allows manual refresh
- Hides when feature is disabled

## Usage

### Automatic Operation

The feature is automatically enabled by default and will appear in the sidebar when:

1. Feature is enabled in settings
2. Clipboard contains detectable content
3. Detection confidence is above 30%
4. At least one relevant tool is available

### Manual Control

- **Enable/Disable**: Profile & Settings → General tab
- **Manual Refresh**: Click refresh icon in recommendations section
- **Immediate Effect**: Changes take effect without app restart

## Customization

### Adding New Content Types

1. Add the type to `ContentType` in `types/clipboard.ts`
2. Implement detection logic in `ClipboardDetector`
3. Add tool mappings in `ToolRecommender`
4. Update labels in `RecommendedTools` component

### Adjusting Detection Sensitivity

Modify confidence thresholds in:

- `ClipboardDetector.detectContentType()` - Individual type confidence
- `ToolRecommender.getRecommendations()` - Minimum threshold for recommendations

### Customizing Update Frequency

Change the interval in `useClipboardRecommendations.ts`:

```typescript
const interval = setInterval(() => {
  if (!document.hidden) {
    detectClipboardContent();
  }
}, 30000); // Adjust this value (in milliseconds)
```

### Storage Keys

Settings are stored using these keys:

- `clipboardRecommendationsEnabled` - Enable/disable state
