/**
 * IPv4/IPv6 Validator
 *
 * Validates and analyzes IPv4 and IPv6 addresses.
 *
 * Features:
 * - IPv4 address validation
 * - IPv6 address validation
 * - CIDR notation support
 * - IP range calculation
 * - Binary conversion
 * - Hex conversion
 *
 * How to use:
 * 1. Enter an IP address (IPv4 or IPv6)
 * 2. View validation results and detailed information
 */

import React, { useState } from "react";
import { ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
} from "../components/tool-page-layout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
const ipv6Regex =
  /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})?$|^::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$/;

export function IpValidatorPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    valid: boolean;
    type: string;
    version: string;
    binary?: string;
    hex?: string;
    details?: string;
  } | null>(null);

  const validate = () => {
    if (!input.trim()) {
      setResult(null);
      return;
    }

    const isIpv4 = ipv4Regex.test(input.trim());
    const isIpv6 = ipv6Regex.test(input.trim());

    if (!isIpv4 && !isIpv6) {
      setResult({ valid: false, type: "Invalid", version: "N/A" });
      return;
    }

    if (isIpv4) {
      const [ip, cidr] = input.trim().split("/");
      const octets = ip.split(".").map(Number);
      const binary = octets
        .map((o) => o.toString(2).padStart(8, "0"))
        .join(".");
      const hex = octets
        .map((o) => o.toString(16).padStart(2, "0").toUpperCase())
        .join(":");

      let details = `Octets: ${octets.join(", ")}\n`;
      details += `Class: ${getIpv4Class(octets[0])}\n`;
      if (cidr) {
        const mask = parseInt(cidr);
        const hosts = Math.pow(2, 32 - mask);
        details += `CIDR: /${cidr}\n`;
        details += `Subnet Mask: ${getSubnetMask(mask)}\n`;
        details += `Hosts: ${hosts - 2}\n`;
      }

      setResult({
        valid: true,
        type: "IPv4",
        version: "4",
        binary,
        hex,
        details,
      });
    } else {
      const fullIp = expandIpv6(input.trim());
      const binary = ipToBinary(fullIp);
      const groups = fullIp.split(":");

      let details = `Expanded: ${fullIp}\n`;
      details += `Groups: ${groups.length}\n`;

      setResult({
        valid: true,
        type: "IPv6",
        version: "6",
        binary,
        hex: input.trim().toUpperCase(),
        details,
      });
    }
  };

  const getIpv4Class = (firstOctet: number) => {
    if (firstOctet >= 1 && firstOctet <= 126) return "A";
    if (firstOctet >= 128 && firstOctet <= 191) return "B";
    if (firstOctet >= 192 && firstOctet <= 223) return "C";
    if (firstOctet >= 224 && firstOctet <= 239) return "D (Multicast)";
    if (firstOctet >= 240 && firstOctet <= 255) return "E (Reserved)";
    return "Unknown";
  };

  const getSubnetMask = (cidr: number) => {
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return [
      (mask >>> 24) & 255,
      (mask >>> 16) & 255,
      (mask >>> 8) & 255,
      mask & 255,
    ].join(".");
  };

  const expandIpv6 = (ip: string) => {
    if (ip.includes("::")) {
      const parts = ip.split("::");
      const left = parts[0].split(":").filter(Boolean);
      const right = parts[1].split(":").filter(Boolean);
      const missing = 8 - left.length - right.length;
      return [...left, ...Array(missing).fill("0000"), ...right]
        .map((p) => p.padStart(4, "0"))
        .join(":");
    }
    return ip
      .split(":")
      .map((p) => p.padStart(4, "0"))
      .join(":");
  };

  const ipToBinary = (ipv6: string) => {
    return ipv6
      .split(":")
      .map((hex) => parseInt(hex, 16).toString(2).padStart(16, "0"))
      .join(":");
  };

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="IPv4/IPv6 Validator"
        description="Validate and analyze IPv4 and IPv6 addresses"
      />

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ip">IP Address</Label>
          <div className="flex gap-2">
            <Input
              id="ip"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && validate()}
              placeholder="e.g., 192.168.1.1 or 2001:0db8:85a3::8a2e:0370:7334"
              className="flex-1"
            />
            <Button size="sm" onClick={validate}>Validate</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const samples = [
                  "192.168.1.1/24",
                  "10.0.0.1",
                  "172.16.0.1/16",
                  "2001:0db8:85a3::8a2e:0370:7334",
                  "::1",
                  "fe80::1",
                ];
                const sample = samples[Math.floor(Math.random() * samples.length)];
                setInput(sample);
              }}
            >
              Sample
            </Button>
            <ToolClearButton onClear={() => { setInput(""); setResult(null); }} />
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg ${result.valid ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500"}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full ${result.valid ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="font-medium">
                  {result.valid ? "Valid IP Address" : "Invalid IP Address"}
                </span>
                {result.valid && (
                  <span className="text-muted-foreground">({result.type})</span>
                )}
              </div>
            </div>

            {result.valid && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Binary</Label>
                  <div className="p-3 bg-muted rounded font-mono text-sm break-all">
                    {result.binary}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hexadecimal</Label>
                  <div className="p-3 bg-muted rounded font-mono text-sm break-all">
                    {result.hex}
                  </div>
                </div>
              </div>
            )}

            {result.details && (
              <div className="space-y-2">
                <Label>Details</Label>
                <div className="p-3 bg-muted rounded font-mono text-sm whitespace-pre-wrap">
                  {result.details}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </ToolPageContainer>
  );
}
