/**
 * JWT Builder
 *
 * Creates and signs JSON Web Tokens (JWT) for authentication and authorization.
 *
 * Features:
 * - Support for HS256, HS384, and HS512 signing algorithms
 * - Customizable payload claims with string, number, and boolean types
 * - Pre-built buttons for standard JWT claims (exp, nbf, iat, jti)
 * - Secret key visibility toggle for secure input
 * - Real-time token generation with HMAC signature
 * - Decoded header and payload preview in JSON format
 * - Copy buttons for easy export of token and decoded parts
 * - Input validation with security warnings
 *
 * How to use:
 * 1. Select the signing algorithm (HS256 is recommended for most cases)
 * 2. Enter a secret key (minimum 32 characters recommended for HS256)
 * 3. Add or modify claims using the "Add Claim" button
 * 4. Use quick buttons to add standard claims (exp, nbf, iat, jti)
 * 5. Click "Generate Token" to create the JWT
 * 6. Use copy buttons to export the token or view decoded header/payload
 */

import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import { Eye, EyeOff, RefreshCw, Plus, Trash2 } from "lucide-react";
import React from "react";
import { AppCodeMirror } from "../components/app-code-mirror";
import { ToolCopyButton, ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolErrorBanner,
} from "../components/tool-page-layout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToolState } from "../hooks/useToolState";

interface Claim {
  key: string;
  value: string;
  type: "string" | "number" | "boolean";
}

interface JwtBuilderState {
  algorithm: string;
  secret: string;
  claims: Claim[];
  showSecret: boolean;
}

const algorithms = ["HS256", "HS384", "HS512"];

const initialState: JwtBuilderState = {
  algorithm: "HS256",
  secret: "",
  claims: [
    { key: "sub", value: "1234567890", type: "string" },
    { key: "name", value: "John Doe", type: "string" },
    {
      key: "iat",
      value: Math.floor(Date.now() / 1000).toString(),
      type: "number",
    },
  ],
  showSecret: false,
};

export function JwtBuilderPage() {
  const [state, setState, clearState] = useToolState(
    "jwt-builder",
    initialState,
  );

  const algorithm = state?.algorithm ?? initialState.algorithm;
  const secret = state?.secret ?? initialState.secret;
  const claims = state?.claims ?? initialState.claims;
  const showSecret = state?.showSecret ?? initialState.showSecret;
  const [generatedToken, setGeneratedToken] = React.useState("");
  const [error, setError] = React.useState("");
  const [warning, setWarning] = React.useState("");

  const updateState = (updates: Partial<JwtBuilderState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const textEncoder = new TextEncoder();

  const base64UrlEncode = (bytes: Uint8Array): string => {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  };

  const base64Encode = (str: string): string => {
    return base64UrlEncode(textEncoder.encode(str));
  };

  const signToken = async (
    headerB64: string,
    payloadB64: string,
    secretInput: string,
    alg: string,
  ): Promise<string> => {
    const signingInput = `${headerB64}.${payloadB64}`;

    const hashAlgo =
      alg === "HS256" ? "SHA-256" : alg === "HS384" ? "SHA-384" : "SHA-512";

    const key = await crypto.subtle.importKey(
      "raw",
      textEncoder.encode(secretInput),
      { name: "HMAC", hash: hashAlgo },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      textEncoder.encode(signingInput),
    );
    return base64UrlEncode(new Uint8Array(signature));
  };

  const generateToken = async () => {
    try {
      if (!secret.trim()) {
        setError("Secret is required");
        return;
      }

      if (secret.length < 32 && algorithm.startsWith("HS")) {
        setWarning("Warning: Secret should be at least 256 bits for HS256");
      } else {
        setWarning("");
      }

      const headerObj = { alg: algorithm, typ: "JWT" };
      const headerB64 = base64Encode(JSON.stringify(headerObj));

      const payloadObj: Record<string, unknown> = {};
      for (const claim of claims) {
        if (claim.key.trim()) {
          switch (claim.type) {
            case "number":
              payloadObj[claim.key] = Number(claim.value);
              break;
            case "boolean":
              payloadObj[claim.key] = claim.value === "true";
              break;
            default:
              payloadObj[claim.key] = claim.value;
          }
        }
      }

      const payloadB64 = base64Encode(JSON.stringify(payloadObj));
      const signature = await signToken(
        headerB64,
        payloadB64,
        secret,
        algorithm,
      );

      const token = `${headerB64}.${payloadB64}.${signature}`;
      setGeneratedToken(token);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate token");
    }
  };

  const handleAddClaim = () => {
    setState((prev) => ({
      ...prev,
      claims: [...prev.claims, { key: "", value: "", type: "string" }],
    }));
  };

  const handleRemoveClaim = (index: number) => {
    setState((prev) => ({
      ...prev,
      claims: prev.claims.filter((_, i) => i !== index),
    }));
  };

  const handleClaimChange = (
    index: number,
    field: keyof Claim,
    value: string,
  ) => {
    const newClaims = [...claims];
    if (field === "type") {
      const currentValue = newClaims[index].value;
      if (value === "number") {
        newClaims[index].value = currentValue
          ? String(Number(currentValue) || 0)
          : "0";
      } else if (value === "boolean") {
        newClaims[index].value = currentValue === "true" ? "true" : "false";
      }
    }
    newClaims[index] = { ...newClaims[index], [field]: value };
    updateState({ claims: newClaims });
  };

  const handleAddStandardClaim = (type: "exp" | "nbf" | "iat" | "jti") => {
    const now = Math.floor(Date.now() / 1000);
    let value = now.toString();

    switch (type) {
      case "exp":
        value = (now + 3600).toString();
        break;
      case "nbf":
        value = now.toString();
        break;
      case "iat":
        value = now.toString();
        break;
      case "jti":
        value = crypto.randomUUID();
        break;
    }

    const exists = claims.some((c) => c.key === type);
    if (!exists) {
      setState((prev) => ({
        ...prev,
        claims: [
          ...prev.claims,
          {
            key: type,
            value,
            type:
              type === "iat" || type === "exp" || type === "nbf"
                ? "number"
                : "string",
          },
        ],
      }));
    }
  };

  const loadSampleData = () => {
    setState({
      algorithm: "HS256",
      secret: "your-256-bit-secret-key-here",
      claims: [
        { key: "sub", value: "1234567890", type: "string" },
        { key: "name", value: "John Doe", type: "string" },
        { key: "admin", value: "true", type: "boolean" },
        {
          key: "iat",
          value: Math.floor(Date.now() / 1000).toString(),
          type: "number",
        },
      ],
      showSecret: false,
    });
    setGeneratedToken("");
    setError("");
    setWarning("");
  };

  const handleClear = async () => {
    await clearState();
    setGeneratedToken("");
    setError("");
    setWarning("");
  };

  const header = { alg: algorithm, typ: "JWT" };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="JWT Builder"
        description="Create and sign JSON Web Tokens"
      />

      <div className="space-y-4">
        <Card className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Algorithm</Label>
              <Select
                value={algorithm}
                onValueChange={(value) => updateState({ algorithm: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {algorithms.map((alg) => (
                    <SelectItem key={alg} value={alg}>
                      {alg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Secret Key</Label>
              <div className="relative">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={secret}
                  onChange={(e) => updateState({ secret: e.target.value })}
                  placeholder="Enter your secret key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => updateState({ showSecret: !showSecret })}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showSecret ? "Hide secret" : "Show secret"}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {warning && <p className="text-xs text-amber-500">{warning}</p>}
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Payload Claims</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStandardClaim("exp")}
              >
                + exp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStandardClaim("nbf")}
              >
                + nbf
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStandardClaim("iat")}
              >
                + iat
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStandardClaim("jti")}
              >
                + jti
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {claims.map((claim, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Key"
                  value={claim.key}
                  onChange={(e) =>
                    handleClaimChange(index, "key", e.target.value)
                  }
                  className="w-32"
                />
                <Select
                  value={claim.type}
                  onValueChange={(value) =>
                    handleClaimChange(index, "type", value)
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Value"
                  value={claim.value}
                  onChange={(e) =>
                    handleClaimChange(index, "value", e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveClaim(index)}
                  disabled={claims.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={handleAddClaim} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Claim
          </Button>
        </Card>

        <div className="flex gap-2">
          <Button size="sm" onClick={generateToken} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Token
          </Button>
          <Button variant="outline" size="sm" onClick={loadSampleData}>
            Sample
          </Button>
          <ToolClearButton onClear={handleClear} />
        </div>

        <ToolErrorBanner error={error} />

        {generatedToken && (
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated JWT</Label>
              <ToolCopyButton value={generatedToken} />
            </div>
            <AppCodeMirror
              value={generatedToken}
              height="100px"
              className="font-mono text-sm"
              extensions={[EditorView.lineWrapping]}
              editable={false}
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
              }}
            />
          </Card>
        )}

        {generatedToken && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Header (decoded)</Label>
                <ToolCopyButton value={JSON.stringify(header, null, 2)} />
              </div>
              <AppCodeMirror
                value={JSON.stringify(header, null, 2)}
                height="100px"
                className="text-sm"
                extensions={[json(), EditorView.lineWrapping]}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                }}
              />
            </Card>

            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Payload (decoded)</Label>
                <ToolCopyButton
                  value={JSON.stringify(
                    claims.reduce(
                      (acc, c) => ({
                        ...acc,
                        [c.key]:
                          c.type === "number"
                            ? Number(c.value)
                            : c.type === "boolean"
                              ? c.value === "true"
                              : c.value,
                      }),
                      {},
                    ),
                    null,
                    2,
                  )}
                />
              </div>
              <AppCodeMirror
                value={JSON.stringify(
                  claims.reduce(
                    (acc, c) => ({
                      ...acc,
                      [c.key]:
                        c.type === "number"
                          ? Number(c.value)
                          : c.type === "boolean"
                            ? c.value === "true"
                            : c.value,
                    }),
                    {},
                  ),
                  null,
                  2,
                )}
                height="200px"
                className="text-sm"
                extensions={[json(), EditorView.lineWrapping]}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: false,
                }}
              />
            </Card>
          </div>
        )}
      </div>
    </ToolPageContainer>
  );
}
