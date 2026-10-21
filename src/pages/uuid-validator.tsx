/**
 * UUID Validator
 *
 * Instantly validates and inspects UUIDs locally on your device.
 *
 * Features:
 * - Accepts canonical, compact, uppercase, braced GUID, and UUID URN input
 * - Checks hexadecimal digits, length, hyphen positions, version, and variant
 * - Recognizes versions 1-8 and the special Nil and Max UUIDs
 * - Extracts UTC timestamps for v1/v6/v7 and node/clock sequence for v1/v6
 * - Copies normalized UUID formats and a complete JSON inspection report
 * - Includes examples, clear action, and persistent input via app settings
 *
 * How to use:
 * 1. Paste a UUID or load an example.
 * 2. Read the live validation result and any suggested corrections.
 * 3. Inspect its version, variant, and available timestamp fields.
 * 4. Copy a normalized format or the report; use Clear to reset the tool.
 */
import React, { useMemo } from "react";
import { CheckCircle2, Fingerprint, XCircle } from "lucide-react";
import { ToolClearButton, ToolCopyButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
} from "../components/tool-page-layout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToolState } from "../hooks/useToolState";
import { validateUuid } from "../utils/uuid-validator";

const initialState = { input: "" };
const samples = [
  { label: "v1", value: "c232ab00-9414-11ec-b3c8-9f6bdeced846" },
  { label: "v4", value: "550e8400-e29b-41d4-a716-446655440000" },
  { label: "v7", value: "017f22e2-79b0-7cc3-98c4-dc0c0c07398f" },
  { label: "Nil", value: "00000000-0000-0000-0000-000000000000" },
  { label: "Invalid", value: "550e8400-e29b-41d4-a716-44665544000g" },
];

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="space-y-1 min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm break-all">{value}</dd>
    </div>
  );
}

export function UuidValidatorPage() {
  const [state, setState, clearState] = useToolState(
    "uuid-validator",
    initialState,
  );
  const result = useMemo(() => validateUuid(state.input), [state.input]);
  const formats = result?.valid
    ? [
        ["Canonical", result.canonical!],
        ["Uppercase", result.canonical!.toUpperCase()],
        ["Compact", result.compact!],
        ["URN", `urn:uuid:${result.canonical}`],
        ["Braced GUID", `{${result.canonical}}`],
      ]
    : [];

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="UUID Validator"
        description="Validate UUIDs and inspect their version, variant, and embedded timestamp"
      />
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label htmlFor="uuidInput">UUID</Label>
          <ToolClearButton onClear={clearState} />
        </div>
        <Input
          id="uuidInput"
          value={state.input}
          onChange={(event) => setState({ input: event.target.value })}
          placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
          className="font-mono"
          spellCheck={false}
          autoComplete="off"
          aria-invalid={result ? !result.valid : undefined}
          aria-describedby="uuid-input-help"
        />
        <p id="uuid-input-help" className="text-sm text-muted-foreground">
          Enter a UUID with or without hyphens. Uppercase, braces, and urn:uuid:
          are also accepted. Validation runs locally.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Examples:</span>
          {samples.map((sample) => (
            <Button
              key={sample.label}
              variant="outline"
              size="sm"
              onClick={() => setState({ input: sample.value })}
              aria-label={`Load ${sample.label} example`}
            >
              {sample.label}
            </Button>
          ))}
        </div>
      </Card>

      <div aria-live="polite" aria-atomic="true">
        {result ? (
          <Card
            className={`p-5 space-y-3 ${result.valid ? "border-green-500/40 bg-green-500/10" : "border-red-500/40 bg-red-500/10"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {result.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <h2 className="font-semibold">
                  {result.valid ? "Valid UUID" : "Invalid UUID"}
                </h2>
                {result.special && (
                  <span className="text-sm">{result.special}</span>
                )}
              </div>
              <ToolCopyButton
                value={JSON.stringify(result, null, 2)}
                label="Copy report"
              />
            </div>
            {result.errors.length > 0 && (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
            {result.note && (
              <p className="text-sm text-muted-foreground">{result.note}</p>
            )}
          </Card>
        ) : (
          <Card className="p-8 text-center text-muted-foreground space-y-2">
            <Fingerprint className="h-8 w-8 mx-auto" />
            <p>Paste a UUID to see its validation result and details.</p>
          </Card>
        )}
      </div>

      {result?.canonical && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">UUID details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Detail label="Input format" value={result.format!} />
            <Detail
              label="Version"
              value={
                result.special
                  ? `Not applicable (${result.special})`
                  : result.version !== undefined
                    ? `v${result.version} — ${result.versionName}`
                    : "Not defined for this variant"
              }
            />
            <Detail label="Variant" value={result.variant!} />
            <Detail
              label="Variant field (first four bits)"
              value={result.variantBits!}
            />
            {result.timestamp && (
              <Detail
                label="Embedded timestamp (UTC)"
                value={result.timestamp}
              />
            )}
            {result.unixMilliseconds !== undefined && (
              <Detail
                label="Unix timestamp (milliseconds)"
                value={result.unixMilliseconds}
              />
            )}
            {result.timestampTicks && (
              <Detail
                label="Timestamp (100 ns ticks since 1582-10-15)"
                value={result.timestampTicks}
              />
            )}
            {result.node && (
              <Detail label="Node identifier" value={result.node} />
            )}
            {result.clockSequence !== undefined && (
              <Detail label="Clock sequence" value={result.clockSequence} />
            )}
          </dl>
        </Card>
      )}

      {formats.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Normalized formats</h2>
          {formats.map(([label, value]) => (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <ToolCopyButton
                  value={value}
                  label={`Copy ${label.toLowerCase()}`}
                />
              </div>
              <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
                {value}
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card className="p-6 space-y-3 text-sm text-muted-foreground">
        <h2 className="font-semibold text-foreground">About UUID validation</h2>
        <p>
          A UUID is a 128-bit identifier written as 32 hexadecimal digits,
          usually grouped as 8-4-4-4-12. This tool recognizes versions 1–8 with
          the RFC variant, plus the special Nil and Max values. Legacy NCS and
          Microsoft variants are identified but are not accepted as RFC UUIDs.
        </p>
        <p>
          Validation checks structure. It cannot prove that an identifier is
          unique, was generated securely, or contains an authentic creation
          time.
        </p>
        <p>
          Use the canonical format for text interchange. For database storage,
          use a native UUID type when available; compact and braced
          representations depend on the receiving system.
        </p>
      </Card>
    </ToolPageContainer>
  );
}
