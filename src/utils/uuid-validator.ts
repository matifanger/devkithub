/** UUID structure inspection based on RFC 9562 (including legacy v2). */
export interface UuidValidation {
  valid: boolean;
  errors: string[];
  format?: string;
  canonical?: string;
  compact?: string;
  version?: number;
  versionName?: string;
  variant?: string;
  variantBits?: string;
  special?: "Nil" | "Max";
  timestamp?: string;
  unixMilliseconds?: number;
  timestampTicks?: string;
  node?: string;
  clockSequence?: number;
  note?: string;
}

const VERSION_NAMES: Record<number, string> = {
  1: "Time-based",
  2: "DCE security",
  3: "Name-based (MD5)",
  4: "Random",
  5: "Name-based (SHA-1)",
  6: "Reordered time-based",
  7: "Unix time-based",
  8: "Custom",
};

export function validateUuid(input: string): UuidValidation | null {
  let value = input.trim();
  if (!value) return null;
  let wrapper = "";
  if (/^urn:uuid:/i.test(value)) {
    value = value.slice(9);
    wrapper = "URN / ";
  } else if (value.startsWith("{") && value.endsWith("}")) {
    value = value.slice(1, -1);
    wrapper = "Braced GUID / ";
  }

  const errors: string[] = [];
  const invalidCharacter = value.search(/[^0-9a-f-]/i);
  if (invalidCharacter !== -1) {
    errors.push(
      `Invalid character at position ${invalidCharacter + 1}. Use only hexadecimal digits (0-9, a-f) and hyphens.`,
    );
  }
  const compact = value.replace(/-/g, "").toLowerCase();
  if (compact.length !== 32) {
    errors.push(
      `Incorrect length: ${compact.length} characters excluding hyphens; expected 32 hexadecimal digits.`,
    );
  }
  const hasHyphens = value.includes("-");
  if (
    hasHyphens &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    ) &&
    invalidCharacter === -1 &&
    compact.length === 32
  ) {
    errors.push(
      "Incorrect hyphen positions. Use five groups of 8-4-4-4-12 hexadecimal digits, or omit all hyphens.",
    );
  }
  if (errors.length) return { valid: false, errors };

  const canonical = [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join("-");
  const variantDigit = parseInt(compact[16], 16);
  const variant =
    variantDigit < 8
      ? "NCS (legacy)"
      : variantDigit < 12
        ? "RFC 9562 / RFC 4122"
        : variantDigit < 14
          ? "Microsoft (legacy)"
          : "Reserved";
  const result: UuidValidation = {
    valid: true,
    errors,
    format:
      wrapper +
      (hasHyphens
        ? "Canonical (8-4-4-4-12)"
        : "Compact (32 hexadecimal digits)"),
    canonical,
    compact,
    variant,
    variantBits: variantDigit.toString(2).padStart(4, "0"),
  };
  // Sentinels are explicitly valid regardless of version/variant bits.
  if (/^0{32}$/.test(compact) || /^f{32}$/.test(compact)) {
    result.special = compact[0] === "0" ? "Nil" : "Max";
    result.note =
      result.special === "Nil"
        ? "Special all-zero UUID representing an absent value. It has no version or timestamp."
        : "Special all-one UUID representing the maximum value. It has no version or timestamp.";
    return result;
  }

  const version = parseInt(compact[12], 16);
  // The version field is only defined for the RFC variant.
  if (variantDigit < 8 || variantDigit > 11) {
    errors.push(
      `Unsupported variant: ${variant}. RFC UUIDs require 8, 9, a, or b at the start of the fourth group.`,
    );
  } else {
    result.version = version;
    result.versionName = VERSION_NAMES[version] ?? "Reserved";
    if (!VERSION_NAMES[version])
      errors.push(
        `Unsupported version: ${version}. Expected a version from 1 to 8, or a Nil/Max UUID.`,
      );
  }
  result.valid = errors.length === 0;
  if (!result.valid) return result;

  if (version === 1 || version === 6) {
    const timeHex =
      version === 1
        ? compact.slice(13, 16) + compact.slice(8, 12) + compact.slice(0, 8)
        : compact.slice(0, 12) + compact.slice(13, 16);
    const ticks = BigInt(`0x${timeHex}`);
    // Divide before subtracting the epoch to floor pre-1970 fractions correctly.
    result.unixMilliseconds = Number(ticks / 10000n - 12219292800000n);
    result.timestampTicks = ticks.toString();
    result.node = compact.slice(20).match(/.{2}/g)!.join(":");
    result.clockSequence = parseInt(compact.slice(16, 20), 16) & 0x3fff;
    result.note =
      "The embedded timestamp is shown in UTC to millisecond precision. The node identifier may be random; it is not necessarily a MAC address.";
  } else if (version === 7) {
    result.unixMilliseconds = parseInt(compact.slice(0, 12), 16);
    result.note =
      "The first 48 bits encode a Unix timestamp in milliseconds. Remaining fields do not encode a standard node identifier.";
  } else if (version === 2) {
    result.note =
      "Legacy DCE security layout. Only structure, version, and variant are checked; a complete timestamp cannot be recovered using the v1 layout.";
  } else if (version === 3 || version === 5) {
    result.note =
      "Name-based UUID. The original name and namespace cannot be recovered or verified from the UUID alone.";
  } else if (version === 4) {
    result.note =
      "Random UUID with 122 available random bits. It contains no timestamp. Format validation cannot verify randomness or uniqueness.";
  } else {
    result.note =
      "Custom UUID layout. Payload semantics, including any timestamp, depend on its implementation.";
  }
  if (result.unixMilliseconds !== undefined)
    result.timestamp = new Date(result.unixMilliseconds).toISOString();
  return result;
}
