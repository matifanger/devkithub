import React, { useState, ChangeEvent, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import 'prismjs/components/prism-markup';
import { Label } from '../components/ui/label';

export function Base64ImageEncoderDecoderPage() {
  const [input, setInput] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [detectedFormat, setDetectedFormat] = useState<'raw' | 'dataurl' | 'css' | null>(null);
  const [highlightedInput, setHighlightedInput] = useState('');

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const detectFormat = (text: string) => {
    if (!text.trim()) {
      setDetectedFormat(null);
      return;
    }
    
    if (text.startsWith('data:')) {
      setDetectedFormat('dataurl');
      return;
    }
    
    if (text.startsWith('background-image:') || text.startsWith('url(')) {
      setDetectedFormat('css');
      return;
    }
    
    setDetectedFormat('raw');
  };

  useEffect(() => {
    detectFormat(input);
    
    // Highlight the input
    const highlighted = Prism.highlight(
      input,
      Prism.languages.markup,
      'markup'
    );
    setHighlightedInput(highlighted);
    
    // Try to set image data based on input format
    if (input.startsWith('data:')) {
      setImageData(input);
    } else if (input.startsWith('background-image:')) {
      const match = input.match(/url\(['"]?(.*?)['"]?\)/);
      if (match) setImageData(match[1]);
    } else if (input.trim()) {
      // Assume raw base64
      try {
        setImageData(`data:image/png;base64,${input}`);
      } catch (err) {
        console.error('Invalid base64 string');
      }
    } else {
      setImageData(null);
    }
  }, [input]);

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error('Failed to read from clipboard');
    }
  };

  const handleImageClipboardPaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType(item.types[0]);
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (typeof result === 'string') {
              setImageData(result);
              setInput(result);
            }
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    } catch (err) {
      console.error('Failed to read image from clipboard');
    }
  };

  const handleImageFileLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (typeof result === 'string') {
            setImageData(result);
            setInput(result);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const saveImage = () => {
    if (imageData) {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = 'image.' + (imageData.includes('image/png') ? 'png' : 'jpg');
      link.click();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-2">
        <h1 className="text-2xl font-bold">Base64 Image Encoder/Decoder</h1>
        <p className="text-muted-foreground">Convert image to and from Base64 encoding</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
              <Label>String</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>Clipboard</Button>
              <Button variant="outline" onClick={() => setInput('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII=')}>Sample</Button>
              <Button variant="outline" onClick={() => setInput('')}>Clear</Button>
              <Button variant="outline" onClick={() => copyToClipboard(input)}>
                Copy
              </Button>
            </div>
          </div>

          <Card className="relative">
            <Textarea
              value={input}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              placeholder="Enter base64 image data"
              className="relative min-h-[calc(100vh-24rem)] font-mono bg-[#272822] text-transparent caret-white text-white"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
            />
            <pre className="min-h-[calc(100vh-24rem)] font-mono overflow-auto">
              <code 
                className="language-markup"
                dangerouslySetInnerHTML={{ __html: highlightedInput || ' ' }}
              />
            </pre>
          </Card>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Detected format: <span className="font-semibold">{detectedFormat || 'none'}</span>
            </div>
            <div className="text-sm text-right text-muted-foreground">
              {new TextEncoder().encode(input).length.toLocaleString()} bytes
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
          <Label>Image</Label>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleImageClipboardPaste}>Clipboard</Button>
              <Button variant="outline" onClick={handleImageFileLoad}>Load file</Button>
              <Button variant="outline" onClick={() => { setImageData(null); setInput(''); }}>Clear</Button>
              <Button variant="outline" onClick={saveImage}>Save</Button>
              <Button variant="outline" onClick={() => copyToClipboard(imageData || '')}>
                Copy
              </Button>
            </div>
          </div>

          <Card className="p-4 flex items-center justify-center min-h-[calc(100vh-24rem)] bg-muted">
            {imageData && (
              <img 
                src={imageData} 
                alt="Decoded" 
                className="max-w-full max-h-[calc(100vh-28rem)] object-contain"
                onLoad={handleImageLoad}
              />
            )}
          </Card>

          <div className="text-sm text-right text-muted-foreground">
            {imageSize.width}x{imageSize.height} | {imageData ? new TextEncoder().encode(imageData).length.toLocaleString() : 0} bytes
          </div>
        </div>
      </div>
    </div>
  );
} 