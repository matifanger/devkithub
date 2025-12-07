import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CopyButton } from '../components/ui/copy-button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { encryptionAlgorithmGroups } from '../data/encryption-algorithms';
import { hashAlgorithmGroups } from '../data/hash-algorithms';
import { StringCodec, StringCodecId, stringCodecs } from '../utils/string-codecs';

type EncodeMode = 'encode' | 'decode';
type HashCase = 'lowercase' | 'uppercase';
type CryptoEncoding = 'utf8' | 'hex' | 'base64' | 'latin1';

const encodingSample = 'Hello, World!';

const encodingModes: { value: EncodeMode; label: string }[] = [
  { value: 'encode', label: 'Encode' },
  { value: 'decode', label: 'Decode' },
];

const hashCaseOptions: { value: HashCase; label: string }[] = [
  { value: 'lowercase', label: 'lowercase' },
  { value: 'uppercase', label: 'UPPERCASE' },
];

const cryptoEncodingOptions: { value: CryptoEncoding; label: string }[] = [
  { value: 'utf8', label: 'UTF-8' },
  { value: 'hex', label: 'Hex' },
  { value: 'base64', label: 'Base64' },
  { value: 'latin1', label: 'Latin-1' },
];

const needsAuthTag = (algorithm: string) => /gcm|ccm|ocb|poly1305|chacha20/i.test(algorithm);

const requiresIvByDefault = (algorithm: string) =>
  /(cbc|cfb|ofb|ctr|gcm|ccm|ocb|xts)/i.test(algorithm);

type HashResult = {
  value: string;
  error?: string;
};

const EncodingPanel: React.FC = () => {
  const [codecId, setCodecId] = useState<StringCodecId>('base64');
  const [mode, setMode] = useState<EncodeMode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const codec = useMemo<StringCodec | undefined>(
    () => stringCodecs.find((item) => item.id === codecId),
    [codecId]
  );

  useEffect(() => {
    if (!codec) return;
    if (!input) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      if (mode === 'encode') {
        setOutput(codec.encode(input));
      } else {
        if (!codec.decode) {
          throw new Error('Decode operation is not available for this codec');
        }
        setOutput(codec.decode(input));
      }
      setError(null);
    } catch (err) {
      setOutput('');
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  }, [codec, input, mode]);

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      setError('Failed to read clipboard');
    }
  };

  const handleSwap = () => {
    if (!output) return;
    setInput(output);
    setMode((prev) => (prev === 'encode' ? 'decode' : 'encode'));
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <Label className="text-sm font-semibold">Codec</Label>
            <Select value={codecId} onValueChange={(value) => setCodecId(value as StringCodecId)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stringCodecs.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <Label className="text-sm font-semibold">Mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as EncodeMode)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {encodingModes.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {codec?.description && <p className="text-sm text-muted-foreground">{codec.description}</p>}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Input</Label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClipboardPaste}>
                  Clipboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInput(encodingSample);
                  }}
                >
                  Sample
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInput('');
                  }}
                >
                  Clear
                </Button>
                <Button variant="outline" onClick={handleSwap} disabled={!output}>
                  Swap
                </Button>
              </div>
            </div>
            <AppCodeMirror
              value={input}
              height="220px"
              onChange={setInput}
              extensions={[]}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
              placeholder={
                mode === 'encode' ? 'Enter text to encode' : 'Enter encoded text to decode'
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Output</Label>
              <Button
                variant="outline"
                disabled={!output}
                onClick={() => {
                  if (!output) return;
                  navigator.clipboard
                    .writeText(output)
                    .catch(() => setError('Failed to copy output to clipboard'));
                }}
              >
                Copy
              </Button>
            </div>
            <AppCodeMirror
              value={output}
              height="220px"
              editable={false}
              extensions={[]}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
      </Card>
    </div>
  );
};

const useSupportedHashAlgorithms = () =>
  useMemo(
    () =>
      hashAlgorithmGroups.flatMap((group) =>
        group.algorithms.filter((algo) => algo.supported).map((algo) => algo.id)
      ),
    []
  );

const HashPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [casing, setCasing] = useState<HashCase>('lowercase');
  const [hashResults, setHashResults] = useState<Record<string, HashResult>>({});
  const supportedAlgorithms = useSupportedHashAlgorithms();

  useEffect(() => {
    let isCancelled = false;

    if (!input.trim()) {
      setHashResults({});
      return;
    }

    const computeHashes = async () => {
      const entries = await Promise.all(
        supportedAlgorithms.map(async (algorithm) => {
          try {
            const hash = await window.cryptoAPI.hash(algorithm, input);
            if (!hash) {
              return [
                algorithm,
                {
                  value: '',
                  error: 'Unavailable',
                },
              ] as const;
            }
            return [algorithm, { value: hash }] as const;
          } catch (err) {
            return [
              algorithm,
              {
                value: '',
                error: err instanceof Error ? err.message : 'Failed to compute hash',
              },
            ] as const;
          }
        })
      );

      if (!isCancelled) {
        setHashResults(Object.fromEntries(entries));
      }
    };

    computeHashes();
    return () => {
      isCancelled = true;
    };
  }, [input, supportedAlgorithms]);

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error('Failed to read from clipboard', err);
    }
  };

  const handleFileLoad = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setInput(text);
        };
        reader.readAsText(file);
      }
    };
    fileInput.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,_1.2fr)_minmax(0,_1fr)]">
        <Card className="p-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label>Input</Label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInput(encodingSample);
                }}
              >
                Sample
              </Button>
              <Button variant="outline" onClick={handleFileLoad}>
                Load File...
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInput('');
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          <AppCodeMirror
            value={input}
            className="h-[calc(100vh-19rem)]"
            height="100%"
            width="100%"
            onChange={setInput}
            extensions={[]}
            placeholder="Enter text to hash"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
            }}
          />
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Total bytes: {new TextEncoder().encode(input).length}
            </div>
            <Select value={casing} onValueChange={(value) => setCasing(value as HashCase)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hashCaseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6 max-h-[calc(100vh-19rem)] overflow-y-auto pr-2">
            {hashAlgorithmGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                    {group.label}
                  </h3>
                </div>
                <div className="space-y-4">
                  {group.algorithms.map((algorithm) => {
                    const result = hashResults[algorithm.id];
                    const displayValue =
                      result?.value && casing === 'uppercase'
                        ? result.value.toUpperCase()
                        : result?.value
                          ? result.value.toLowerCase()
                          : '';

                    return (
                      <div key={algorithm.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="uppercase text-xs">{algorithm.id}</Label>
                        </div>
                        {result?.error ? (
                          <p className="text-sm text-destructive">{result.error}</p>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              value={displayValue}
                              readOnly
                              className="font-mono bg-muted flex-1"
                            />
                            <CopyButton
                              value={displayValue}
                              disabled={!displayValue}
                              src={algorithm.id}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const EncryptionPanel: React.FC = () => {
  const [availableCiphers, setAvailableCiphers] = useState<Set<string>>(new Set());
  const [algorithm, setAlgorithm] = useState<string>('aes-256-gcm');
  const [algorithmSearch, setAlgorithmSearch] = useState('');
  const [algorithmSelectOpen, setAlgorithmSelectOpen] = useState(false);
  const algorithmSearchRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [key, setKey] = useState('');
  const [iv, setIv] = useState('');
  const [aad, setAad] = useState('');
  const [authTag, setAuthTag] = useState('');
  const [generatedAuthTag, setGeneratedAuthTag] = useState<string | null>(null);
  const [authTagLength, setAuthTagLength] = useState('');
  const [inputEncoding, setInputEncoding] = useState<CryptoEncoding>('utf8');
  const [outputEncoding, setOutputEncoding] = useState<CryptoEncoding>('base64');
  const [keyEncoding, setKeyEncoding] = useState<CryptoEncoding>('utf8');
  const [ivEncoding, setIvEncoding] = useState<CryptoEncoding>('hex');
  const [aadEncoding, setAadEncoding] = useState<CryptoEncoding>('utf8');
  const [authTagEncoding, setAuthTagEncoding] = useState<CryptoEncoding>('hex');
  const [autoPadding, setAutoPadding] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.cryptoAPI
      .getCiphers()
      .then((list) => setAvailableCiphers(new Set(list.map((item) => item.toLowerCase()))))
      .catch((err) => {
        console.error('Failed to load cipher list', err);
      });
  }, []);

  useEffect(() => {
    if (mode === 'encrypt') {
      setInputEncoding('utf8');
      setOutputEncoding('base64');
    } else {
      setInputEncoding('base64');
      setOutputEncoding('utf8');
    }
  }, [mode]);

  useEffect(() => {
    if (!algorithmSelectOpen) return;
    // Keep the inline search focused even if the list re-renders while typing
    requestAnimationFrame(() => algorithmSearchRef.current?.focus());
  }, [algorithmSearch, algorithmSelectOpen]);

  const filteredEncryptionGroups = useMemo(() => {
    const search = algorithmSearch.trim().toLowerCase();
    const hasAvailabilityFilter = availableCiphers.size > 0;

    const byAvailability = hasAvailabilityFilter
      ? encryptionAlgorithmGroups
          .map((group) => ({
            ...group,
            algorithms: group.algorithms.filter((algo) =>
              availableCiphers.has(algo.id.toLowerCase())
            ),
          }))
          .filter((group) => group.algorithms.length > 0)
      : encryptionAlgorithmGroups;

    if (!search) return byAvailability;

    return byAvailability
      .map((group) => ({
        ...group,
        algorithms: group.algorithms.filter((algo) => {
          const name = (algo.label ?? algo.id).toLowerCase();
          return name.includes(search) || algo.id.toLowerCase().includes(search);
        }),
      }))
      .filter((group) => group.algorithms.length > 0);
  }, [availableCiphers, algorithmSearch]);

  useEffect(() => {
    if (!availableCiphers.size) return;
    const normalized = algorithm.toLowerCase();
    if (!availableCiphers.has(normalized)) {
      const fallback =
        filteredEncryptionGroups
          .flatMap((group) => group.algorithms.map((algo) => algo.id))
          .find((id) => availableCiphers.has(id.toLowerCase())) ?? '';
      if (fallback) {
        setAlgorithm(fallback);
      }
    }
  }, [algorithm, availableCiphers, filteredEncryptionGroups]);

  const isSupported = !availableCiphers.size || availableCiphers.has(algorithm.toLowerCase());
  const needsTag = needsAuthTag(algorithm);
  const ivRequired = requiresIvByDefault(algorithm);

  const handleProcess = async () => {
    setError(null);
    if (mode === 'encrypt') {
      setGeneratedAuthTag(null);
    }
    setProcessing(true);
    try {
      if (!key) {
        throw new Error('Key is required');
      }
      if (!isSupported) {
        throw new Error('Algorithm is not available on this platform');
      }

      if (ivRequired && iv.length === 0) {
        throw new Error('An initialization vector is required for this algorithm.');
      }

      const requiresExplicitTagLength = /ccm/i.test(algorithm);
      if (requiresExplicitTagLength && !authTagLength) {
        throw new Error('Auth tag length is required when using CCM modes.');
      }

      const normalizedIv = iv.length > 0 ? iv : undefined;
      const normalizedAAD = aad.length > 0 ? aad : undefined;

      const baseOptions = {
        algorithm,
        key,
        iv: normalizedIv,
        keyEncoding,
        ivEncoding,
        aad: normalizedAAD,
        aadEncoding,
        authTagLength: authTagLength ? Number(authTagLength) : undefined,
        autoPadding,
      };

      if (mode === 'encrypt') {
        const response = await window.cryptoAPI.encrypt({
          ...baseOptions,
          data: input,
          inputEncoding,
          outputEncoding,
        });
        setOutput(response.output);
        const nextAuthTag = response.authTag ?? null;
        setGeneratedAuthTag(nextAuthTag);
        setAuthTag(nextAuthTag ?? '');
        if (needsTag && !nextAuthTag) {
          setError(
            'Encryption succeeded, but the host crypto module did not return an auth tag for this algorithm.'
          );
        }
      } else {
        if (needsTag && !authTag) {
          throw new Error('Auth tag is required for decryption with this algorithm');
        }
        const plain = await window.cryptoAPI.decrypt({
          ...baseOptions,
          data: input,
          inputEncoding,
          outputEncoding,
          authTag: authTag || undefined,
          authTagEncoding,
        });
        setOutput(plain);
      }
    } catch (err) {
      setOutput('');
      setError(err instanceof Error ? err.message : 'Failed to process input');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Algorithm</Label>
            <Select
              value={algorithm}
              onValueChange={setAlgorithm}
              open={algorithmSelectOpen}
              onOpenChange={(nextOpen) => {
                setAlgorithmSelectOpen(nextOpen);
                if (nextOpen) {
                  requestAnimationFrame(() => algorithmSearchRef.current?.focus());
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className="max-h-[26rem]"
                onCloseAutoFocus={(event: Event) => {
                  // Avoid focusing a null target when the content unmounts
                  event.preventDefault();
                }}
              >
                <div className="sticky top-0 z-10 bg-popover p-2">
                  <Input
                    ref={algorithmSearchRef}
                    value={algorithmSearch}
                    onChange={(event) => setAlgorithmSearch(event.target.value)}
                    onKeyDown={(event) => event.stopPropagation()}
                    placeholder="Search algorithms..."
                    className="h-9"
                  />
                </div>
                {filteredEncryptionGroups.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.algorithms.map((item) => {
                      const cipherName = item.label ?? item.id;
                      return (
                        <SelectItem key={item.id} value={item.id}>
                          {cipherName}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as 'encrypt' | 'decrypt')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="encrypt">Encrypt</SelectItem>
                <SelectItem value="decrypt">Decrypt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col justify-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch checked={autoPadding} onCheckedChange={setAutoPadding} />
                <div className="space-y-1">
                  <Label className="text-sm">Auto padding</Label>
                  <p className="text-xs text-muted-foreground">
                    Adjusts padding automatically for block ciphers (disable when managing padding
                    manually).
                  </p>
                </div>
              </div>
            </div>
            {needsTag && (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-muted px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium uppercase">Auth tag required</span>
                <span>Provide AAD and auth tag when decrypting AEAD modes like GCM/CCM/OCB.</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'}</Label>
              <div className="flex gap-2">
                <Select
                  value={inputEncoding}
                  onValueChange={(value) => setInputEncoding(value as CryptoEncoding)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cryptoEncodingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setInput(text);
                    } catch {
                      setError('Failed to read from clipboard');
                    }
                  }}
                >
                  Clipboard
                </Button>
                <Button variant="outline" onClick={() => setInput('')}>
                  Clear
                </Button>
              </div>
            </div>
            <AppCodeMirror
              value={input}
              height="220px"
              onChange={setInput}
              extensions={[]}
              placeholder={
                mode === 'encrypt'
                  ? 'Enter the text you want to encrypt'
                  : 'Enter the ciphertext to decrypt'
              }
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Output</Label>
              <div className="flex gap-2">
                <Select
                  value={outputEncoding}
                  onValueChange={(value) => setOutputEncoding(value as CryptoEncoding)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cryptoEncodingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={!output}
                  onClick={() =>
                    output
                      ? navigator.clipboard
                          .writeText(output)
                          .catch(() => setError('Failed to copy encrypted output to clipboard'))
                      : undefined
                  }
                >
                  Copy
                </Button>
              </div>
            </div>
            <AppCodeMirror
              value={output}
              height="220px"
              editable={false}
              extensions={[]}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
              }}
            />
            {needsTag && (
              <div className="space-y-2 rounded-md border border-dashed border-muted/60 bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Auth tag (last run)
                  </Label>
                  {generatedAuthTag && (
                    <span className="text-[11px] text-muted-foreground">
                      Auto-filled in the form below
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={generatedAuthTag ?? ''}
                    readOnly
                    className="font-mono"
                    placeholder="Run an encryption to generate the auth tag"
                  />
                  <CopyButton
                    value={generatedAuthTag ?? ''}
                    disabled={!generatedAuthTag}
                    src="generated-auth-tag"
                  />
                </div>
                {!generatedAuthTag && (
                  <p className="text-xs text-muted-foreground">
                    AEAD ciphers (GCM/CCM/OCB) output an auth tag after encrypting. You will need it
                    for decryption.
                  </p>
                )}
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label>Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={key}
                    onChange={(event) => setKey(event.target.value)}
                    placeholder="Encryption key"
                  />
                  <Select
                    value={keyEncoding}
                    onValueChange={(value) => setKeyEncoding(value as CryptoEncoding)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoEncodingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Initialization Vector</Label>
                <div className="flex gap-2">
                  <Input
                    value={iv}
                    onChange={(event) => setIv(event.target.value)}
                    placeholder={
                      ivRequired ? 'IV (required for most block modes)' : 'IV (optional)'
                    }
                  />
                  <Select
                    value={ivEncoding}
                    onValueChange={(value) => setIvEncoding(value as CryptoEncoding)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoEncodingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label>Additional Authenticated Data</Label>
              <div className="flex gap-2">
                <Textarea
                  value={aad}
                  onChange={(event) => setAad(event.target.value)}
                  placeholder="AAD (optional, for AEAD modes)"
                  rows={3}
                />
                <Select
                  value={aadEncoding}
                  onValueChange={(value) => setAadEncoding(value as CryptoEncoding)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cryptoEncodingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {needsTag && (
              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <Label>Auth Tag</Label>
                  <div className="flex gap-2">
                    <Input
                      value={authTag}
                      onChange={(event) => setAuthTag(event.target.value)}
                      placeholder={
                        mode === 'encrypt'
                          ? 'Generated after encryption'
                          : 'Required for decryption'
                      }
                      disabled={mode === 'encrypt'}
                    />
                    <Select
                      value={authTagEncoding}
                      onValueChange={(value) => setAuthTagEncoding(value as CryptoEncoding)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cryptoEncodingOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {mode === 'encrypt'
                      ? 'Value is populated automatically every time you encrypt.'
                      : 'Paste the auth tag captured during encryption if it differs from the auto-filled value.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Auth Tag Length (bytes)</Label>
                  <Input
                    value={authTagLength}
                    onChange={(event) => setAuthTagLength(event.target.value.replace(/\D/g, ''))}
                    placeholder="Default depends on algorithm (e.g. 16)"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleProcess} disabled={processing}>
            {processing ? 'Processing...' : mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export function EncodeDecodePage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Encode & Decode Tools</h1>
        <p className="text-muted-foreground">
          Unified toolkit for string encoding, hashing, and encryption workflows.
        </p>
      </div>

      <Tabs defaultValue="encoding" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="encoding">String Encoding</TabsTrigger>
          <TabsTrigger value="hashing">Hash Generation</TabsTrigger>
          <TabsTrigger value="encryption">String Encryption</TabsTrigger>
        </TabsList>

        <TabsContent value="encoding">
          <EncodingPanel />
        </TabsContent>
        <TabsContent value="hashing">
          <HashPanel />
        </TabsContent>
        <TabsContent value="encryption">
          <EncryptionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
