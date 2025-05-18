import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { Settings } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface CertificateInfo {
  subject: { [key: string]: string };
  issuer: { [key: string]: string };
  validity: {
    notBefore: string;
    notAfter: string;
  };
  serialNumber: string;
  version: string;
  signatureAlgorithm: string;
  publicKey: {
    algorithm: string;
    bits?: number;
  };
  extensions?: { [key: string]: string };
}

export function CertificateDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [format, setFormat] = useState('pem');
  const [outputFormat, setOutputFormat] = useState('json');
  const [certInfo, setCertInfo] = useState<CertificateInfo | null>(null);

  const formatCertificateInfo = useCallback(
    (certInfo: CertificateInfo | null, format: string): string => {
      if (!certInfo) return '';

      switch (format) {
        case 'json':
          return JSON.stringify(certInfo, null, 2);
        case 'yaml':
          return `subject:
  CN: ${certInfo.subject.CN}
  O: ${certInfo.subject.O}
  C: ${certInfo.subject.C}
issuer:
  CN: ${certInfo.issuer.CN}
  O: ${certInfo.issuer.O}
  C: ${certInfo.issuer.C}
validity:
  notBefore: ${certInfo.validity.notBefore}
  notAfter: ${certInfo.validity.notAfter}
serialNumber: ${certInfo.serialNumber}
version: ${certInfo.version}
signatureAlgorithm: ${certInfo.signatureAlgorithm}
publicKey:
  algorithm: ${certInfo.publicKey.algorithm}
  bits: ${certInfo.publicKey.bits}
extensions:
  basicConstraints: ${certInfo.extensions?.basicConstraints}
  keyUsage: ${certInfo.extensions?.keyUsage}
  extendedKeyUsage: ${certInfo.extensions?.extendedKeyUsage}`;
        case 'text':
          return `Certificate Information:
-------------------
Subject:
  Common Name: ${certInfo.subject.CN}
  Organization: ${certInfo.subject.O}
  Country: ${certInfo.subject.C}

Issuer:
  Common Name: ${certInfo.issuer.CN}
  Organization: ${certInfo.issuer.O}
  Country: ${certInfo.issuer.C}

Validity Period:
  Not Before: ${new Date(certInfo.validity.notBefore).toLocaleString()}
  Not After: ${new Date(certInfo.validity.notAfter).toLocaleString()}

Serial Number: ${certInfo.serialNumber}
Version: ${certInfo.version}
Signature Algorithm: ${certInfo.signatureAlgorithm}

Public Key:
  Algorithm: ${certInfo.publicKey.algorithm}
  Key Size: ${certInfo.publicKey.bits} bits

Extensions:
  Basic Constraints: ${certInfo.extensions?.basicConstraints}
  Key Usage: ${certInfo.extensions?.keyUsage}
  Extended Key Usage: ${certInfo.extensions?.extendedKeyUsage}`;
        case 'openssl':
          return `Certificate:
    Data:
        Version: ${certInfo.version} (0x2)
        Serial Number: ${certInfo.serialNumber}
        Signature Algorithm: ${certInfo.signatureAlgorithm}
        Issuer: C=${certInfo.issuer.C}, O=${certInfo.issuer.O}, CN=${certInfo.issuer.CN}
        Validity
            Not Before: ${new Date(certInfo.validity.notBefore).toUTCString()}
            Not After : ${new Date(certInfo.validity.notAfter).toUTCString()}
        Subject: C=${certInfo.subject.C}, O=${certInfo.subject.O}, CN=${certInfo.subject.CN}
        Subject Public Key Info:
            Public Key Algorithm: ${certInfo.publicKey.algorithm}
            RSA Public-Key: (${certInfo.publicKey.bits} bit)
        X509v3 extensions:
            X509v3 Basic Constraints: 
                ${certInfo.extensions?.basicConstraints}
            X509v3 Key Usage: 
                ${certInfo.extensions?.keyUsage}
            X509v3 Extended Key Usage: 
                ${certInfo.extensions?.extendedKeyUsage}`;
        default:
          return JSON.stringify(certInfo, null, 2);
      }
    },
    []
  );

  const parseCertificate = useCallback(
    (cert: string) => {
      try {
        if (!cert.trim()) {
          setCertInfo(null);
          setError('');
          return;
        }

        // Basic validation for PEM format
        if (format === 'pem' && !cert.includes('-----BEGIN CERTIFICATE-----')) {
          throw new Error('Invalid PEM certificate format');
        }

        // This is a mock implementation - in a real app, you'd use a library like node-forge
        const mockCertInfo: CertificateInfo = {
          subject: {
            CN: 'example.com',
            O: 'Example Organization',
            C: 'US',
          },
          issuer: {
            CN: 'Example CA',
            O: 'Example Certificate Authority',
            C: 'US',
          },
          validity: {
            notBefore: new Date().toISOString(),
            notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          },
          serialNumber: '1234567890',
          version: '3',
          signatureAlgorithm: 'SHA256withRSA',
          publicKey: {
            algorithm: 'RSA',
            bits: 2048,
          },
          extensions: {
            basicConstraints: 'CA:FALSE',
            keyUsage: 'Digital Signature, Key Encipherment',
            extendedKeyUsage: 'TLS Web Server Authentication, TLS Web Client Authentication',
          },
        };

        setCertInfo(mockCertInfo);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid certificate');
        setCertInfo(null);
      }
    },
    [format]
  );

  // Update output whenever certInfo or outputFormat changes
  useEffect(() => {
    setOutput(formatCertificateInfo(certInfo, outputFormat));
  }, [certInfo, outputFormat, formatCertificateInfo]);

  const handleSample = () => {
    const sample = `-----BEGIN CERTIFICATE-----
MIIDfTCCAmWgAwIBAgIJAJB2iRjqPtgOMA0GCSqGSIb3DQEBCwUAMFUxCzAJBgNV
BAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRMwEQYDVQQHDApTYW50YSBDbGFy
YTEcMBoGA1UECgwTRXhhbXBsZSBPcmdhbml6YXRpb24wHhcNMjQwMzE5MTYwMDAw
WhcNMjUwMzE5MTYwMDAwWjBVMQswCQYDVQQGEwJVUzETMBEGA1UECAwKQ2FsaWZv
cm5pYTETMBEGA1UEBwwKU2FudGEgQ2xhcmExHDAaBgNVBAoME0V4YW1wbGUgT3Jn
YW5pemF0aW9uMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3w3vn6U8
-----END CERTIFICATE-----`;
    setInput(sample);
    parseCertificate(sample);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      parseCertificate(text);
    } catch (err) {
      setError('Failed to read from clipboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Certificate Decoder (X.509)</h1>
        <p className="text-muted-foreground">
          Decode and analyze X.509 certificates in PEM or DER format
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Label>Input Certificate</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure certificate format options
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Format</Label>
                        <div className="col-span-2">
                          <Select
                            value={format}
                            onValueChange={(value) => {
                              setFormat(value);
                              if (input) parseCertificate(input);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pem">PEM</SelectItem>
                              <SelectItem value="der">DER (Base64)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClipboardPaste}>
                Clipboard
              </Button>
              <Button variant="outline" onClick={handleSample}>
                Sample
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInput('');
                  setOutput('');
                  setError('');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-17rem)]">
            <CodeMirror
              value={input}
              className="h-[calc(100vh-17rem)]"
              height="100%"
              theme={oneDark}
              extensions={[EditorView.lineWrapping, format === 'pem' ? [] : []]}
              onChange={(value) => {
                setInput(value);
                parseCertificate(value);
              }}
              placeholder="Paste your X.509 certificate here (PEM or DER format)"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Label>Decoded Certificate</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Output Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure output format options
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label>Format</Label>
                        <div className="col-span-2">
                          <Select
                            value={outputFormat}
                            onValueChange={(value) => {
                              setOutputFormat(value);
                              if (input) parseCertificate(input);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="yaml">YAML</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="openssl">OpenSSL Style</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button variant="outline" onClick={() => copyToClipboard(output)}>
              Copy
            </Button>
          </div>

          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
          ) : (
            <div className="h-[calc(100vh-17rem)]">
              <CodeMirror
                value={output}
                height="100%"
                className="h-[calc(100vh-17rem)]"
                theme={oneDark}
                extensions={[
                  EditorView.lineWrapping,
                  outputFormat === 'json'
                    ? json()
                    : outputFormat === 'yaml'
                      ? yaml()
                      : EditorView.lineWrapping,
                ]}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
