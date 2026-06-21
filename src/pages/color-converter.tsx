import React, { useEffect, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { ToolCopyButton, ToolClearButton } from '../components/tool-actions';
import {
  ToolPageContainer,
  ToolPageHeader,
} from '../components/tool-page-layout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface ColorFormats {
  hex: string;
  hexAlpha: string;
  rgb: string;
  rgba: string;
  hsl: string;
  hsla: string;
  hsb: string;
  hwb: string;
  cmyk: string;
}

export function ColorConverterPage() {
  const [color, setColor] = useState('#000000');
  const [formats, setFormats] = useState<ColorFormats>({
    hex: '#000000',
    hexAlpha: '#000000FF',
    rgb: 'rgb(0, 0, 0)',
    rgba: 'rgba(0, 0, 0, 1)',
    hsl: 'hsl(0, 0%, 0%)',
    hsla: 'hsla(0, 0%, 0%, 1)',
    hsb: 'hsb(0, 0%, 0%)',
    hwb: 'hwb(0 0% 100%)',
    cmyk: 'cmyk(0%, 0%, 0%, 100%)',
  });

  const hexToRgb = (hex: string): number[] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  };

  const rgbToHsl = (r: number, g: number, b: number): number[] => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  const rgbToHsb = (r: number, g: number, b: number): number[] => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const s = max === 0 ? 0 : (max - min) / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / (max - min) + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / (max - min) + 2;
          break;
        case b:
          h = (r - g) / (max - min) + 4;
          break;
      }
      h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
  };

  const rgbToCmyk = (r: number, g: number, b: number): number[] => {
    let c = 1 - r / 255;
    let m = 1 - g / 255;
    let y = 1 - b / 255;
    const k = Math.min(c, Math.min(m, y));

    if (k === 1) {
      return [0, 0, 0, 100];
    }

    c = ((c - k) / (1 - k)) * 100;
    m = ((m - k) / (1 - k)) * 100;
    y = ((y - k) / (1 - k)) * 100;

    return [Math.round(c), Math.round(m), Math.round(y), Math.round(k * 100)];
  };

  const rgbToHwb = (r: number, g: number, b: number): number[] => {
    const [h] = rgbToHsb(r, g, b);
    const w = (Math.min(r, g, b) / 255) * 100;
    const b_ = 100 - (Math.max(r, g, b) / 255) * 100;
    return [h, Math.round(w), Math.round(b_)];
  };

  const updateFormats = (hex: string) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    const hsb = rgbToHsb(rgb[0], rgb[1], rgb[2]);
    const cmyk = rgbToCmyk(rgb[0], rgb[1], rgb[2]);
    const hwb = rgbToHwb(rgb[0], rgb[1], rgb[2]);

    setFormats({
      hex: hex,
      hexAlpha: hex + 'FF',
      rgb: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
      rgba: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`,
      hsl: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`,
      hsla: `hsla(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%, 1)`,
      hsb: `hsb(${hsb[0]}, ${hsb[1]}%, ${hsb[2]}%)`,
      hwb: `hwb(${hwb[0]} ${hwb[1]}% ${hwb[2]}%)`,
      cmyk: `cmyk(${cmyk[0]}%, ${cmyk[1]}%, ${cmyk[2]}%, ${cmyk[3]}%)`,
    });
  };

  useEffect(() => {
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      updateFormats(color);
    }
  }, [color]);

  useEffect(() => {
    // No-op: syntax highlighting is handled by AppCodeMirror in read-only mode
  }, [formats]);

  const colorPresets = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500',
    '#800080',
    '#008000',
    '#000000',
    '#808080',
    '#FFFFFF',
  ];

  const codeExample = `// Color values
const color = {
  hex: '${formats.hex}',
  hexAlpha: '${formats.hexAlpha}',
  rgb: '${formats.rgb}',
  rgba: '${formats.rgba}',
  hsl: '${formats.hsl}',
  hsla: '${formats.hsla}',
  hsb: '${formats.hsb}',
  hwb: '${formats.hwb}',
  cmyk: '${formats.cmyk}'
};

// CSS variables
:root {
  --color-hex: ${formats.hex};
  --color-rgb: ${formats.rgb};
  --color-hsl: ${formats.hsl};
}

// Tailwind CSS
bg-[${formats.hex}]
text-[${formats.hex}]
border-[${formats.hex}]`;

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Color Converter"
        description="Professional color format converter with support for HEX, RGB(A), HSL(A), HSB/HSV, HWB, and CMYK"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Input</Label>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => navigator.clipboard.readText().then(setColor)}
              >
                Clipboard
              </Button>
              <ToolClearButton onClear={() => setColor('#000000')} />
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-[37px] w-[37px] rounded border bg-transparent"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#000000"
              className="font-mono"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>HEX</Label>
              <div className="flex gap-2">
                <Input value={formats.hex} readOnly className="font-mono bg-muted flex-1" />
                <ToolCopyButton value={formats.hex} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HEX (with alpha)</Label>
              <div className="flex gap-2">
                <Input value={formats.hexAlpha} readOnly className="font-mono bg-muted flex-1" />
                <ToolCopyButton value={formats.hexAlpha} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>RGB</Label>
              <div className="flex gap-2">
                <Input value={formats.rgb} readOnly className="font-mono bg-muted flex-1" />
                <ToolCopyButton value={formats.rgb} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>RGBA</Label>
              <div className="flex gap-2">
                <Input value={formats.rgba} readOnly className="font-mono bg-muted flex-1" />
                <ToolCopyButton value={formats.rgba} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HSL</Label>
              <div className="flex gap-2">
                <Input value={formats.hsl} readOnly className="font-mono bg-muted flex-1" />
                <ToolCopyButton value={formats.hsl} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HSLA</Label>
              <div className="flex gap-2">
                <Input value={formats.hsla} readOnly className="font-mono bg-muted flex-1" />
                <ToolCopyButton value={formats.hsla} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HSB/HSV</Label>
              <div className="flex gap-2">
                <Input value={formats.hsb} readOnly className="font-mono bg-muted flex-1" />
                <ToolCopyButton value={formats.hsb} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HWB</Label>
              <div className="flex gap-2">
                <Input value={formats.hwb} readOnly className="font-mono bg-muted flex-1" />
                <ToolCopyButton value={formats.hwb} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>CMYK</Label>
              <div className="flex gap-2">
                <Input value={formats.cmyk} readOnly className="font-mono bg-muted flex-1" />
                <ToolCopyButton value={formats.cmyk} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="code">
            <TabsList className="w-full">
              <TabsTrigger value="code" className="flex-1">
                Code
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex-1">
                Color Presets
              </TabsTrigger>
              <TabsTrigger value="variables" className="flex-1">
                Variables
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets">
              <Card className="p-4">
                <div
                  className="h-32 rounded-lg transition-colors duration-200 mb-4"
                  style={{ backgroundColor: formats.hex }}
                />
                <div className="grid grid-cols-4 gap-2">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      className="w-full h-12 rounded-md"
                      style={{ backgroundColor: preset }}
                      onClick={() => setColor(preset)}
                    />
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="code">
              <Card className="p-4">
                <AppCodeMirror
                  value={codeExample}
                  height="260px"
                  className="text-sm"
                  extensions={[]}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: false,
                  }}
                />
              </Card>
            </TabsContent>

            <TabsContent value="variables">
              <Card className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label>CSS Custom Properties</Label>
                    <AppCodeMirror
                      value={`:root {\n  --color-hex: ${formats.hex};\n  --color-rgb: ${formats.rgb};\n  --color-hsl: ${formats.hsl};\n}`}
                      height="180px"
                      className="text-sm"
                      extensions={[]}
                      editable={false}
                      basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        highlightActiveLine: false,
                      }}
                    />
                  </div>

                  <div>
                    <Label>Tailwind CSS</Label>
                    <AppCodeMirror
                      value={`bg-[${formats.hex}]\ntext-[${formats.hex}]\nborder-[${formats.hex}]`}
                      height="140px"
                      className="text-sm"
                      extensions={[]}
                      editable={false}
                      basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        highlightActiveLine: false,
                      }}
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ToolPageContainer>
  );
}
