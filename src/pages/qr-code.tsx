import { EditorView } from '@codemirror/view';
import jsQR from 'jsqr';
import { QRCodeCanvas } from 'qrcode.react';
import React, { Component, useCallback, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { ToolClearButton } from '../components/tool-actions';
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolErrorBanner,
} from '../components/tool-page-layout';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';

const QR_TEMPLATES = {
  url: 'https://example.com',
  wifi: 'WIFI:T:WPA;S:NetworkName;P:Password;;',
  email: 'mailto:example@example.com?subject=Subject&body=Body',
  phone: 'tel:+1234567890',
  sms: 'sms:+1234567890:Message',
  geolocation: 'geo:latitude,longitude',
  contact: `BEGIN:VCARD
VERSION:3.0
N:Doe;John;;;
FN:John Doe
TEL:+1234567890
EMAIL:john@example.com
END:VCARD`,
  calendar: `BEGIN:VEVENT
SUMMARY:Event Title
DTSTART:20240101T100000Z
DTEND:20240101T110000Z
DESCRIPTION:Event Description
LOCATION:Event Location
END:VEVENT`,
};

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

interface QRConfig {
  errorCorrection: ErrorCorrectionLevel;
  includeMargin: boolean;
  size: number;
  includeIcon: boolean;
  iconUrl: string;
}

// QR Code capacity limits (characters) for different error correction levels
const QR_CAPACITY = {
  L: {
    numeric: 7089,
    alphanumeric: 4296,
    byte: 2953,
    kanji: 1817,
  },
  M: {
    numeric: 5596,
    alphanumeric: 3391,
    byte: 2331,
    kanji: 1435,
  },
  Q: {
    numeric: 3993,
    alphanumeric: 2420,
    byte: 1663,
    kanji: 1024,
  },
  H: {
    numeric: 3057,
    alphanumeric: 1852,
    byte: 1273,
    kanji: 784,
  },
};

function getContentType(str: string): 'numeric' | 'alphanumeric' | 'byte' | 'kanji' {
  // Check if content is numeric only
  if (/^\d+$/.test(str)) return 'numeric';

  // Check if content is alphanumeric (0-9, A-Z, space, $, %, *, +, -, ., /, :)
  if (/^[0-9A-Z $%*+\-./:]+$/.test(str)) return 'alphanumeric';

  // Check if content contains Kanji characters
  if (/[\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff]/.test(str)) return 'kanji';

  // Default to byte mode
  return 'byte';
}

// Error boundary component
class QRErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex justify-center p-4 bg-white rounded-lg">
          <div className="text-red-500 text-center">
            Failed to generate QR Code. Content might be too large or invalid.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function QRCodePage() {
  const [content, setContent] = useState('');
  const [bytes, setBytes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [config, setConfig] = useState<QRConfig>({
    errorCorrection: 'H',
    includeMargin: true,
    size: 256,
    includeIcon: false,
    iconUrl: '',
  });

  const updateBytes = useCallback((text: string) => {
    const encoder = new TextEncoder();
    setBytes(encoder.encode(text).length);
  }, []);

  const handleContentChange = useCallback(
    (value: string) => {
      const contentType = getContentType(value);
      const capacity = QR_CAPACITY[config.errorCorrection][contentType];
      const encoder = new TextEncoder();
      const byteLength = encoder.encode(value).length;

      // For images, we need to account for base64 overhead
      const effectiveLength = value.startsWith('data:image/')
        ? Math.ceil((value.length * 3) / 4) // base64 decoding ratio
        : byteLength;

      if (effectiveLength > capacity) {
        setError(`Content too long for ${config.errorCorrection} error correction level in ${contentType} mode.
        Current: ${effectiveLength} bytes
        Maximum: ${capacity} bytes
        Try:
        - Reducing error correction level
        - Using simpler characters (numbers > alphanumeric > unicode)
        - Shortening the content
        - For images: reduce size or use URL instead`);
      } else {
        setError(null);
      }

      setContent(value);
      setBytes(effectiveLength);
    },
    [config.errorCorrection]
  );

  const handleTemplateChange = (template: keyof typeof QR_TEMPLATES) => {
    const newContent = QR_TEMPLATES[template];
    setContent(newContent);
    updateBytes(newContent);
  };

  const detectQRInImage = (imageData: ImageData): string | null => {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      return code?.data || null;
    } catch (err) {
      console.error('Error detecting QR:', err);
      return null;
    }
  };

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setInfo(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;

        // Create an image to get dimensions
        const img = new Image();
        img.onload = () => {
          // Create canvas to get image data
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Try to detect QR code
            const qrContent = detectQRInImage(imageData);

            if (qrContent) {
              setInfo('QR code detected in image! Content loaded.');
              handleContentChange(qrContent);
            } else {
              setInfo('No QR code detected. Using image as content for new QR code.');
              handleContentChange(dataUrl);
            }
          } else {
            setError('Failed to process image. Please try another one.');
          }
        };
        img.onerror = () => {
          setError('Failed to load image. Please try another one.');
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try another one.');
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInfo('Text file loaded.');
        handleContentChange(text);
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try another one.');
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = async () => {
    try {
      setError(null);
      setInfo(null);

      const items = await navigator.clipboard.read();
      for (const item of items) {
        // Check if clipboard has image
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType(
            item.types.find((type) => type.startsWith('image/')) || 'image/png'
          );
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;

            // Create an image to get dimensions
            const img = new Image();
            img.onload = () => {
              // Create canvas to get image data
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');

              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Try to detect QR code
                const qrContent = detectQRInImage(imageData);

                if (qrContent) {
                  setInfo('QR code detected in clipboard image! Content loaded.');
                  handleContentChange(qrContent);
                } else {
                  setInfo(
                    'No QR code detected in clipboard image. Using image as content for new QR code.'
                  );
                  handleContentChange(dataUrl);
                }
              } else {
                setError('Failed to process clipboard image. Please try another one.');
              }
            };
            img.onerror = () => {
              setError('Failed to load clipboard image. Please try another one.');
            };
            img.src = dataUrl;
          };
          reader.onerror = () => {
            setError('Failed to read clipboard image. Please try another one.');
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      // If no image found, try text
      const text = await navigator.clipboard.readText();
      setInfo('Text loaded from clipboard.');
      handleContentChange(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setError('Failed to read from clipboard. Make sure you granted permission.');
    }
  };

  const handleClear = () => {
    setContent('');
    updateBytes('');
  };

  const handleSave = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleCopyImage = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]);
        }
      });
    }
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="QR Code Reader/Generator"
        description="Generate and read QR codes with advanced options"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Label className="shrink-0">Content</Label>
            <div className="flex items-center gap-2 flex-wrap">
              <Select onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="wifi">WiFi</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="geolocation">Geolocation</SelectItem>
                  <SelectItem value="contact">Contact (vCard)</SelectItem>
                  <SelectItem value="calendar">Calendar Event</SelectItem>
                </SelectContent>
              </Select>
              <input type="file" onChange={handleFileLoad} className="hidden" id="file-load" />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-load')?.click()}
              >
                Load File
              </Button>
              <Button variant="outline" onClick={handlePaste}>
                Clipboard
              </Button>
              <ToolClearButton onClear={handleClear} />
            </div>
          </div>

          <div className="h-[calc(100vh-30rem)]">
            <AppCodeMirror
              value={content}
              className="h-[calc(100vh-30rem)]"
              height="100%"
              extensions={[EditorView.lineWrapping]}
              onChange={handleContentChange}
              placeholder="Enter or paste content for QR code"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Length: {bytes} bytes</div>
              <div>Mode: {getContentType(content)}</div>
              <div>
                Max capacity: {QR_CAPACITY[config.errorCorrection][getContentType(content)]} bytes
              </div>
              <div>
                Usage:{' '}
                {(
                  (bytes / QR_CAPACITY[config.errorCorrection][getContentType(content)]) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
            <ToolErrorBanner error={error ?? ''} />
            {info && <div className="text-sm text-green-500">{info}</div>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Generated QR Code</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleSave}>
                Save
              </Button>
              <Button variant="outline" onClick={handleCopyImage}>
                Copy Image
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Error Correction</Label>
              <div className="col-span-2">
                <Select
                  value={config.errorCorrection}
                  onValueChange={(value: ErrorCorrectionLevel) =>
                    setConfig((prev) => ({ ...prev, errorCorrection: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Low (7%)</SelectItem>
                    <SelectItem value="M">Medium (15%)</SelectItem>
                    <SelectItem value="Q">Quartile (25%)</SelectItem>
                    <SelectItem value="H">High (30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Size</Label>
              <div className="col-span-2">
                <Slider
                  value={[config.size]}
                  min={128}
                  max={512}
                  step={8}
                  onValueChange={([value]) => setConfig((prev) => ({ ...prev, size: value }))}
                />
                <span className="text-sm text-muted-foreground">{config.size}px</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Include Margin</Label>
              <Switch
                checked={config.includeMargin}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, includeMargin: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Include Icon</Label>
              <Switch
                checked={config.includeIcon}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, includeIcon: checked }))
                }
              />
            </div>

            {config.includeIcon && (
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>Icon URL</Label>
                <div className="col-span-2 flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setConfig((prev) => ({ ...prev, iconUrl: e.target?.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="icon-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('icon-upload')?.click()}
                  >
                    Upload Icon
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRErrorBoundary>
                {!error && content && (
                  <QRCodeCanvas
                    value={content}
                    size={config.size}
                    level={config.errorCorrection}
                    includeMargin={config.includeMargin}
                    imageSettings={
                      config.includeIcon && config.iconUrl
                        ? {
                            src: config.iconUrl,
                            x: undefined,
                            y: undefined,
                            height: config.size * 0.2,
                            width: config.size * 0.2,
                            excavate: true,
                          }
                        : undefined
                    }
                  />
                )}
              </QRErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Make sure to test your QR code before using it in production.
      </p>
    </ToolPageContainer>
  );
}
