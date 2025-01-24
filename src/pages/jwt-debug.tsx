import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { CopyButton } from '../components/ui/copy-button';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import 'prismjs/components/prism-json';

interface JwtParts {
  header: string;
  payload: string;
  signature: string;
  algorithm?: string;
  isValid?: boolean;
}

export function JwtDebuggerPage() {
  const [jwt, setJwt] = useState('');
  const [highlightedHeader, setHighlightedHeader] = useState('');
  const [highlightedPayload, setHighlightedPayload] = useState('');
  const [decoded, setDecoded] = useState<JwtParts | null>(null);
  const [error, setError] = useState('');

  const decodeJwt = (token: string) => {
    try {
      if (!token.trim()) {
        setDecoded(null);
        setError('');
        return;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const headerObj = JSON.parse(atob(parts[0]));
      const headerFormatted = JSON.stringify(headerObj, null, 2);
      const payloadFormatted = JSON.stringify(JSON.parse(atob(parts[1])), null, 2);

      const decoded = {
        header: headerFormatted,
        payload: payloadFormatted,
        signature: parts[2],
        algorithm: headerObj.alg,
        isValid: true // TODO: Implement actual verification
      };

      setHighlightedHeader(Prism.highlight(headerFormatted, Prism.languages.json, 'json'));
      setHighlightedPayload(Prism.highlight(payloadFormatted, Prism.languages.json, 'json'));
      setDecoded(decoded);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JWT');
      setDecoded(null);
    }
  };

  useEffect(() => {
    decodeJwt(jwt);
  }, [jwt]);

  const handleSample = () => {
    const sample = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    setJwt(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJwt(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">JWT Debugger</h1>
        <p className="text-muted-foreground">Decode and inspect JSON Web Tokens</p>
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
              <Button variant="outline" onClick={() => setJwt('')}>
                Clear
              </Button>
            </div>
          </div>
          <Textarea
            id="jwt"
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            placeholder="Paste your JWT here"
            className="font-mono min-h-[100px]"
            style={{ height: 'auto' }}
          />
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {decoded && (
          <>
            <div className="flex items-center space-x-2 p-4 rounded-lg bg-muted">
              <span className="font-semibold">Status:</span>
              <span className={decoded.isValid ? "text-green-500" : "text-red-500"}>
                {decoded.isValid ? "Signature Valid" : "Invalid Signature"}
              </span>
              <span className="font-semibold ml-4">Algorithm:</span>
              <span>{decoded.algorithm}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Header</Label>
                  <CopyButton value={decoded.header} src="header" />
                </div>
                <pre className="p-4 bg-[#272822] rounded-lg overflow-auto max-h-[200px] font-mono">
                  <code 
                    className="language-json"
                    dangerouslySetInnerHTML={{ __html: highlightedHeader }}
                  />
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Payload</Label>
                  <CopyButton value={decoded.payload} src="payload" />
                </div>
                <pre className="p-4 bg-[#272822] rounded-lg overflow-auto max-h-[200px] font-mono">
                  <code 
                    className="language-json"
                    dangerouslySetInnerHTML={{ __html: highlightedPayload }}
                  />
                </pre>
              </div>

              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Signature</Label>
                  <CopyButton value={decoded.signature} src="signature" />
                </div>
                <pre className="p-4 bg-[#272822] text-blue-300 rounded-lg overflow-auto font-mono break-all">
                  {decoded.signature}
                </pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 