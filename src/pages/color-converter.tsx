import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CopyButton } from '../components/ui/copy-button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';

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
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  };

  const rgbToHsl = (r: number, g: number, b: number): number[] => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
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

    return [
      Math.round(h * 360),
      Math.round(s * 100),
      Math.round(l * 100),
    ];
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

    return [
      Math.round(h * 360),
      Math.round(s * 100),
      Math.round(v * 100),
    ];
  };

  const rgbToCmyk = (r: number, g: number, b: number): number[] => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    const k = Math.min(c, Math.min(m, y));

    if (k === 1) {
      return [0, 0, 0, 100];
    }

    c = ((c - k) / (1 - k)) * 100;
    m = ((m - k) / (1 - k)) * 100;
    y = ((y - k) / (1 - k)) * 100;

    return [
      Math.round(c),
      Math.round(m),
      Math.round(y),
      Math.round(k * 100),
    ];
  };

  const rgbToHwb = (r: number, g: number, b: number): number[] => {
    const [h] = rgbToHsb(r, g, b);
    const w = Math.min(r, g, b) / 255 * 100;
    const b_ = 100 - Math.max(r, g, b) / 255 * 100;
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
    Prism.highlightAll();
  }, [formats]);

  const colorPresets = [
    '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#008000',
    '#000000', '#808080', '#FFFFFF'
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Color Converter</h1>
        <p className="text-muted-foreground">Professional color format converter with support for HEX, RGB(A), HSL(A), HSB/HSV, HWB, and CMYK</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Input</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => navigator.clipboard.readText().then(setColor)}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={() => setColor('#000000')}>
                Clear
              </Button>
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
                <CopyButton value={formats.hex} src="hex" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HEX (with alpha)</Label>
              <div className="flex gap-2">
                <Input value={formats.hexAlpha} readOnly className="font-mono bg-muted flex-1" />
                <CopyButton value={formats.hexAlpha} src="hex-alpha" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>RGB</Label>
              <div className="flex gap-2">
                <Input value={formats.rgb} readOnly className="font-mono bg-muted flex-1" />
                <CopyButton value={formats.rgb} src="rgb" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>RGBA</Label>
              <div className="flex gap-2">
                <Input value={formats.rgba} readOnly className="font-mono bg-muted flex-1" />
                <CopyButton value={formats.rgba} src="rgba" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HSL</Label>
              <div className="flex gap-2">
                <Input value={formats.hsl} readOnly className="font-mono bg-muted flex-1" />
                <CopyButton value={formats.hsl} src="hsl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HSLA</Label>
              <div className="flex gap-2">
                <Input value={formats.hsla} readOnly className="font-mono bg-muted flex-1" />
                <CopyButton value={formats.hsla} src="hsla" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HSB/HSV</Label>
              <div className="flex gap-2">
                <Input value={formats.hsb} readOnly className="font-mono bg-muted flex-1" />
                <CopyButton value={formats.hsb} src="hsb" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>HWB</Label>
              <div className="flex gap-2">
                <Input value={formats.hwb} readOnly className="font-mono bg-muted flex-1" />
                <CopyButton value={formats.hwb} src="hwb" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>CMYK</Label>
              <div className="flex gap-2">
                <Input value={formats.cmyk} readOnly className="font-mono bg-muted flex-1" />
                <CopyButton value={formats.cmyk} src="cmyk" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="code">
            <TabsList className="w-full">
              <TabsTrigger value="code" className="flex-1">Code</TabsTrigger>
              <TabsTrigger value="presets" className="flex-1">Color Presets</TabsTrigger>
              <TabsTrigger value="variables" className="flex-1">Variables</TabsTrigger>
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
                <pre className="rounded-lg overflow-x-auto bg-[#272822] p-4">
                  <code
                    className="language-javascript text-sm"
                    dangerouslySetInnerHTML={{
                      __html: Prism.highlight(
                        codeExample,
                        Prism.languages.javascript,
                        'javascript'
                      ),
                    }}
                  />
                </pre>
              </Card>
            </TabsContent>

            <TabsContent value="variables">
              <Card className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label>CSS Custom Properties</Label>
                    <pre className="rounded-lg overflow-x-auto bg-[#272822] p-4 mt-2">
                      <code
                        className="language-css text-sm"
                        dangerouslySetInnerHTML={{
                          __html: Prism.highlight(
                            `:root {
  --color-hex: ${formats.hex};
  --color-rgb: ${formats.rgb};
  --color-hsl: ${formats.hsl};
}`,
                            Prism.languages.css,
                            'css'
                          ),
                        }}
                      />
                    </pre>
                  </div>

                  <div>
                    <Label>Tailwind CSS</Label>
                    <pre className="rounded-lg overflow-x-auto bg-[#272822] p-4 mt-2">
                      <code
                        className="language-javascript text-sm"
                        dangerouslySetInnerHTML={{
                          __html: Prism.highlight(
                            `bg-[${formats.hex}]
text-[${formats.hex}]
border-[${formats.hex}]`,
                            Prism.languages.javascript,
                            'javascript'
                          ),
                        }}
                      />
                    </pre>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 