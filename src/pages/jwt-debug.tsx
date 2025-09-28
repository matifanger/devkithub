import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { Eye, EyeOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AppCodeMirror } from '../components/app-code-mirror';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CopyButton } from '../components/ui/copy-button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface JwtParts {
  header: string;
  payload: string;
  signature: string;
  algorithm?: string;
  isValid?: boolean;
}

export function JwtDebuggerPage() {
  const [jwt, setJwt] = useState('');
  const [decoded, setDecoded] = useState<JwtParts | null>(null);
  const [error, setError] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [payloadText, setPayloadText] = useState('');
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);

  const [secret, setSecret] = useState('');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const textEncoder = new TextEncoder();

  const base64UrlToBase64 = (input: string): string => {
    const replaced = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (replaced.length % 4 || 4)) % 4);
    return replaced + padding;
  };

  const base64UrlDecode = (input: string): string => {
    try {
      return atob(base64UrlToBase64(input));
    } catch (e) {
      throw new Error('Invalid base64url segment');
    }
  };

  const base64UrlEncode = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };

  const decodeJwt = (token: string) => {
    try {
      if (!token.trim()) {
        setDecoded(null);
        setHeaderText('');
        setPayloadText('');
        setClaims(null);
        setIsVerified(null);
        setError('');
        return;
      }

      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');

      const headerObj = JSON.parse(base64UrlDecode(parts[0]));
      const payloadObj = JSON.parse(base64UrlDecode(parts[1]));

      const headerFormatted = JSON.stringify(headerObj, null, 2);
      const payloadFormatted = JSON.stringify(payloadObj, null, 2);

      setHeaderText(headerFormatted);
      setPayloadText(payloadFormatted);
      setClaims(payloadObj);

      setDecoded({
        header: headerFormatted,
        payload: payloadFormatted,
        signature: parts[2],
        algorithm: headerObj.alg,
        isValid: undefined,
      });
      setIsVerified(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JWT');
      setDecoded(null);
      setHeaderText('');
      setPayloadText('');
      setClaims(null);
      setIsVerified(null);
    }
  };

  const verifyHs256 = async (token: string, secretInput: string): Promise<boolean> => {
    try {
      const [headerB64, payloadB64, sigB64] = token.split('.');
      if (!headerB64 || !payloadB64 || !sigB64) return false;
      const signingInput = `${headerB64}.${payloadB64}`;

      const key = await crypto.subtle.importKey(
        'raw',
        textEncoder.encode(secretInput),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(signingInput));
      const signatureBytes = new Uint8Array(signature);
      const computed = base64UrlEncode(signatureBytes);
      return computed === sigB64;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    decodeJwt(jwt);
  }, [jwt]);

  useEffect(() => {
    (async () => {
      if (!decoded || !decoded.algorithm) {
        setIsVerified(null);
        return;
      }
      if (!secret) {
        setIsVerified(null);
        return;
      }
      if (decoded.algorithm === 'HS256') {
        const ok = await verifyHs256(jwt, secret);
        setIsVerified(ok);
      } else {
        setIsVerified(null);
      }
    })();
  }, [decoded?.algorithm, secret, jwt]);

  const handleSample = () => {
    const sampleJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
    const sampleSecret = 'a-string-secret-at-least-256-bits-long';
    setJwt(sampleJwt);
    setSecret(sampleSecret);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJwt(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const formatTimestamp = (value: unknown): string | null => {
    if (typeof value !== 'number') return null;
    try {
      const d = new Date(value * 1000);
      return `${d.toUTCString()} (${d.toISOString()})`;
    } catch {
      return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">JWT Debugger</h1>
        <p className="text-muted-foreground">Decode, verify, and inspect JSON Web Tokens</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="jwt">JWT Token</Label>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setJwt('');
                  setSecret('');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <AppCodeMirror
            value={jwt}
            height="140px"
            className="font-mono"
            onChange={setJwt}
            placeholder="Paste your JWT here"
            extensions={[EditorView.lineWrapping]}
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
          />
        </div>

        <Card className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Algorithm</Label>
              <Input value={decoded?.algorithm ?? ''} readOnly className="font-mono bg-muted" />
            </div>
            <div className="space-y-1">
              <Label>Secret (HS256)</Label>
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter HMAC secret to verify signature"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold">Signature:</span>
            <span
              className={
                isVerified == null
                  ? 'text-muted-foreground'
                  : isVerified
                    ? 'text-green-500'
                    : 'text-red-500'
              }
            >
              {isVerified == null ? 'Not verified' : isVerified ? 'Verified' : 'Invalid'}
            </span>
          </div>
        </Card>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}

        {decoded && (
          <div className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Header</Label>
                  <CopyButton value={decoded.header} src="header" />
                </div>
                <AppCodeMirror
                  value={headerText}
                  height="200px"
                  className="text-sm"
                  extensions={[json(), EditorView.lineWrapping]}
                  editable={false}
                  basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: false }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Payload</Label>
                  <CopyButton value={decoded.payload} src="payload" />
                </div>
                <AppCodeMirror
                  value={payloadText}
                  height="200px"
                  className="text-sm"
                  extensions={[json(), EditorView.lineWrapping]}
                  editable={false}
                  basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: false }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Claims</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {claims && Object.keys(claims).length > 0 ? (
                  Object.entries(claims).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-2 bg-muted rounded-md flex items-start justify-between"
                    >
                      <span className="font-semibold mr-4">{key}</span>
                      <div className="flex items-center gap-2 overflow-x-auto">
                        <span className="font-mono text-sm break-all">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                        <CopyButton
                          value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          src={`claim-${key}`}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No claims present.</div>
                )}

                {claims && (claims['exp'] || claims['iat'] || claims['nbf']) && (
                  <div className="sm:col-span-2 p-3 rounded-md bg-muted/60 space-y-1">
                    {claims['exp'] && (
                      <div>
                        <span className="font-semibold mr-2">exp:</span>
                        <span className="font-mono text-sm">{formatTimestamp(claims['exp'])}</span>
                      </div>
                    )}
                    {claims['nbf'] && (
                      <div>
                        <span className="font-semibold mr-2">nbf:</span>
                        <span className="font-mono text-sm">{formatTimestamp(claims['nbf'])}</span>
                      </div>
                    )}
                    {claims['iat'] && (
                      <div>
                        <span className="font-semibold mr-2">iat:</span>
                        <span className="font-mono text-sm">{formatTimestamp(claims['iat'])}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Signature (base64url)</Label>
                <CopyButton value={decoded.signature} src="signature" />
              </div>
              <AppCodeMirror
                value={decoded.signature}
                height="50px"
                className="text-sm"
                extensions={[EditorView.lineWrapping]}
                editable={false}
                basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
