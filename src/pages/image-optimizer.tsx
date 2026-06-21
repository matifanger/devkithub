import { zipSync } from 'fflate';
import { Download, Trash2, Upload, Wand2 } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { ToolClearButton } from '../components/tool-actions';
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolErrorBanner,
} from '../components/tool-page-layout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
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

type SupportedFormat = 'auto' | 'jpeg' | 'png' | 'webp' | 'avif';

type OptimizeResult = {
  optimizedBlob: Blob;
  optimizedName: string;
  originalBytes: number;
  optimizedBytes: number;
};

export function ImageOptimizerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [quality, setQuality] = useState<number>(85);
  const [stripMetadata, setStripMetadata] = useState<boolean>(true);
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('auto');
  const [enableCompression, setEnableCompression] = useState<boolean>(true);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [bulkResults, setBulkResults] = useState<OptimizeResult[] | null>(null);
  const [error, setError] = useState<string>('');
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
  const cancelRef = React.useRef<boolean>(false);
  const [wasCancelled, setWasCancelled] = useState<boolean>(false);

  const fileInputId = 'image-optimizer-file';

  const readableSize = useCallback((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  const isImageFile = (file: File) => {
    if (file.type && file.type.startsWith('image/')) return true;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'bmp', 'svg'].includes(ext);
  };

  const handleFile = (f: File | File[] | null) => {
    setError('');
    setResult(null);
    setBulkResults(null);
    const raw = Array.isArray(f) ? f : f ? [f] : [];
    const list = raw.filter(isImageFile);
    setFiles(list);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    if (list[0]) setPreviewUrl(URL.createObjectURL(list[0]));
    else setPreviewUrl('');
    setPreviewUrls(list.slice(0, 3).map((file) => URL.createObjectURL(file)));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files ? Array.from(e.target.files).filter(isImageFile) : [];
    handleFile(fl);
    e.currentTarget.value = '';
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      const fl = Array.from(e.dataTransfer.files).filter(isImageFile);
      handleFile(fl);
    }
  };

  const deriveOutputName = (inputName: string, fmt: SupportedFormat): string => {
    const idx = inputName.lastIndexOf('.');
    const base = idx > 0 ? inputName.slice(0, idx) : inputName;
    const ext = fmt === 'auto' ? inputName.slice(idx + 1).toLowerCase() : fmt;
    return `${base}.optimized.${ext}`;
  };

  const runImagemagick = async (
    input: File,
    opts: {
      format: SupportedFormat;
      quality: number;
      strip: boolean;
    }
  ): Promise<OptimizeResult> => {
    const inputExt = (input.name.split('.').pop() || '').toLowerCase();
    const chosenFormat: SupportedFormat =
      opts.format === 'auto'
        ? inputExt === 'jpg'
          ? 'jpeg'
          : ['jpeg', 'png', 'webp', 'avif'].includes(inputExt)
            ? (inputExt as SupportedFormat)
            : 'jpeg'
        : opts.format;
    const outputName = deriveOutputName(input.name, chosenFormat);

    const imgDataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(input);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = imgDataUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0);

    const mime =
      chosenFormat === 'jpeg'
        ? 'image/jpeg'
        : chosenFormat === 'png'
          ? 'image/png'
          : chosenFormat === 'webp'
            ? 'image/webp'
            : 'image/avif';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        mime,
        enableCompression && chosenFormat !== 'png'
          ? Math.max(0.6, Math.min(1, opts.quality / 100))
          : undefined
      );
    });

    return {
      optimizedBlob: blob,
      optimizedName: outputName,
      originalBytes: input.size,
      optimizedBytes: blob.size,
    };
  };

  const handleOptimize = async () => {
    if (!files.length) {
      setError('Please select one or more images first');
      return;
    }
    setIsOptimizing(true);
    setError('');
    setResult(null);
    setBulkResults(null);
    setProcessedCount(0);
    const operationStartMs = Date.now();
    setStartTimeMs(operationStartMs);
    setElapsedMs(0);
    cancelRef.current = false;
    setWasCancelled(false);
    try {
      if (files.length === 1) {
        const r = await runImagemagick(files[0], {
          format: targetFormat,
          quality,
          strip: stripMetadata,
        });
        setResult(r);
        setProcessedCount(1);
      } else {
        const out: OptimizeResult[] = [];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const r = await runImagemagick(f, {
            format: targetFormat,
            quality,
            strip: stripMetadata,
          });
          out.push(r);
          setProcessedCount(i + 1);
          if (cancelRef.current) {
            setWasCancelled(true);
            break;
          }
        }
        setBulkResults(out);
      }
    } catch (err) {
      setError('Optimization failed');
      console.error('Optimization failed', err);
    } finally {
      setIsOptimizing(false);
      setLastDurationMs(Date.now() - operationStartMs);
      setStartTimeMs(null);
    }
  };

  const handleCancel = () => {
    if (!isOptimizing) return;
    cancelRef.current = true;
  };

  React.useEffect(() => {
    if (isOptimizing && startTimeMs) {
      const id = window.setInterval(() => {
        setElapsedMs(Date.now() - startTimeMs);
      }, 250);
      return () => window.clearInterval(id);
    }
  }, [isOptimizing, startTimeMs]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const two = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
  };

  const savingText = useMemo(() => {
    if (!result) return '';
    const delta = result.originalBytes - result.optimizedBytes;
    const pct = result.originalBytes > 0 ? (Math.abs(delta) / result.originalBytes) * 100 : 0;
    return delta >= 0
      ? `${readableSize(delta)} saved (${pct.toFixed(1)}%)`
      : `${readableSize(Math.abs(delta))} increase (${pct.toFixed(1)}%)`;
  }, [result, readableSize]);

  const handleDownload = async () => {
    if (result) {
      const url = URL.createObjectURL(result.optimizedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.optimizedName;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (bulkResults && bulkResults.length) {
      const files: Record<string, Uint8Array> = {};
      for (const r of bulkResults) {
        const buf = new Uint8Array(await r.optimizedBlob.arrayBuffer());
        files[r.optimizedName] = buf;
      }
      const zipped = zipSync(files, { level: 6 });
      const blob = new Blob([zipped], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized-images.zip';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Image Optimizer/Converter"
        description="Convert and optimize images. In some cases, optimized files can be larger (e.g., converting from already-compressed formats, metadata retention, or when target codec parameters differ)."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Source Images</Label>
            <div className="flex items-center gap-2">
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
                multiple
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById(fileInputId)?.click()}
              >
                <Upload className="w-4 h-4 mr-2" /> Load
              </Button>
              {files.length > 0 && (
                <ToolClearButton onClear={() => handleFile(null)} label="Clear images" />
              )}
            </div>
          </div>

          <div
            className="rounded-md border border-dashed border-border h-64 flex items-center justify-center overflow-hidden bg-muted/30 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => document.getElementById(fileInputId)?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById(fileInputId)?.click();
              }
            }}
            role="button"
            tabIndex={0}
          >
            {files.length <= 1 ? (
              previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm select-none">
                  <Upload className="w-6 h-6" />
                  <div>Click or drag & drop images here</div>
                </div>
              )
            ) : (
              <div className="p-2 w-full h-full">
                <div className="h-full grid grid-cols-2 gap-2 items-center justify-center">
                  {previewUrls.slice(0, 3).map((u, idx) => (
                    <img
                      key={idx}
                      src={u}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-24 object-cover rounded"
                    />
                  ))}
                  {files.length > 3 && (
                    <div className="mt-2  text-center text-xs text-muted-foreground">
                      +{files.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <div>
                Selected {files.length} files (size:{' '}
                {readableSize(files.reduce((a, f) => a + f.size, 0))})
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Target format</Label>
              <div className="pt-2">
                <Select
                  value={targetFormat}
                  onValueChange={(v: SupportedFormat) => setTargetFormat(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (keep original)</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="avif">AVIF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Enable compression</span>
              <Switch checked={enableCompression} onCheckedChange={setEnableCompression} />
            </div>

            {enableCompression && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Quality</Label>
                    <span className="text-xs text-muted-foreground">{quality}</span>
                  </div>
                  <div className="pt-3">
                    <Slider
                      value={[quality]}
                      min={60}
                      max={100}
                      step={1}
                      onValueChange={(v) => setQuality(v[0])}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Higher values = larger size
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm">Strip metadata (EXIF, ICC)</span>
              <Switch checked={stripMetadata} onCheckedChange={setStripMetadata} />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleOptimize} disabled={!files.length || isOptimizing}>
                <Wand2 className="w-4 h-4 mr-2" />
                {isOptimizing ? 'Processing…' : 'Convert/Optimize'}
              </Button>
              {(result || (bulkResults && bulkResults.length)) && !isOptimizing && (
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" /> Download{bulkResults ? ' ZIP' : ''}
                </Button>
              )}
            </div>

            {isOptimizing && (
              <div className="mt-3 p-3 rounded-md border bg-muted/40">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>
                    {processedCount}/{files.length} files
                  </span>
                  <div className="flex items-center gap-3">
                    <span>Elapsed: {formatDuration(elapsedMs)}</span>
                    {processedCount > 0 && processedCount < files.length && (
                      <span>
                        ETA:{' '}
                        {formatDuration(
                          Math.max(
                            0,
                            Math.round(
                              (elapsedMs / Math.max(processedCount, 1)) *
                                (files.length - processedCount)
                            )
                          )
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded overflow-hidden">
                  <div
                    className="h-2 bg-primary transition-all"
                    style={{
                      width: `${Math.round((processedCount / Math.max(files.length, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isOptimizing) cancelRef.current = true;
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <ToolErrorBanner error={error} />

            {result && (
              <div className="text-sm">
                <div className="text-foreground">Output: {result.optimizedName}</div>
                <div className="text-muted-foreground">
                  Original: {readableSize(result.originalBytes)}
                </div>
                <div className="text-muted-foreground">
                  Optimized: {readableSize(result.optimizedBytes)}
                </div>
                <div className="text-green-600">{savingText}</div>
              </div>
            )}

            {bulkResults && bulkResults.length > 0 && (
              <div className="text-sm">
                <div className="text-foreground">Processed: {bulkResults.length} files</div>
                {lastDurationMs !== null && lastDurationMs > 0 && (
                  <div className="text-muted-foreground">
                    Time elapsed: {formatDuration(lastDurationMs)}
                  </div>
                )}
                {cancelRef.current && (
                  <div className="text-amber-600">Cancelled before completion</div>
                )}
                {(() => {
                  const totalOriginal = bulkResults.reduce((a, b) => a + b.originalBytes, 0);
                  const totalOptimized = bulkResults.reduce((a, b) => a + b.optimizedBytes, 0);
                  const delta = totalOriginal - totalOptimized;
                  return (
                    <>
                      <div className="text-muted-foreground">
                        Total original: {readableSize(totalOriginal)}
                      </div>
                      <div className="text-muted-foreground">
                        Total optimized: {readableSize(totalOptimized)}
                      </div>
                      {delta >= 0 ? (
                        <div className="text-green-600">Saved: {readableSize(delta)}</div>
                      ) : (
                        <div className="text-red-600">
                          Increase: {readableSize(Math.abs(delta))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </Card>
      </div>
    </ToolPageContainer>
  );
}
