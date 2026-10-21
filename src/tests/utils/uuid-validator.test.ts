import { describe, expect, it } from "vitest";
import { validateUuid } from "../../utils/uuid-validator";

const v4 = "550e8400-e29b-41d4-a716-446655440000";

describe("validateUuid", () => {
  it.each(["", " \n\t "])("keeps blank input neutral", (input) => {
    expect(validateUuid(input)).toBeNull();
  });

  it.each([
    v4,
    v4.toUpperCase(),
    v4.replace(/-/g, ""),
    `  ${v4}  `,
    `{${v4}}`,
    `urn:uuid:${v4}`,
    `URN:UUID:${v4.toUpperCase()}`,
  ])("normalizes accepted input %s", (input) => {
    expect(validateUuid(input)).toMatchObject({
      valid: true,
      canonical: v4,
      version: 4,
      variant: "RFC 9562 / RFC 4122",
    });
  });

  it.each([
    [v4.slice(0, -1), "Incorrect length"],
    [v4 + "0", "Incorrect length"],
    [v4.slice(0, -1) + "g", "Invalid character"],
    [v4.replace("-", ""), "Incorrect hyphen positions"],
    ["-" + v4, "Incorrect hyphen positions"],
    [v4.replace("-", "--"), "Incorrect hyphen positions"],
    [v4.replace("-", " "), "Invalid character"],
    [`{${v4}`, "Invalid character"],
    [`${v4}}`, "Invalid character"],
    [`urn:uuid:{${v4}}`, "Invalid character"],
  ])("rejects malformed input %s", (input, error) => {
    const result = validateUuid(input)!;
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain(error);
    expect(result.canonical).toBeUndefined();
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])("recognizes version %i", (version) => {
    expect(validateUuid(v4.replace("41d4", `${version}1d4`))).toMatchObject({
      valid: true,
      version,
    });
  });

  it.each(["0", "9", "a", "f"])("rejects reserved version %s", (version) => {
    expect(validateUuid(v4.replace("41d4", `${version}1d4`))).toMatchObject({
      valid: false,
      versionName: "Reserved",
    });
  });

  it.each(["8", "9", "a", "b"])("accepts RFC variant nibble %s", (variant) => {
    expect(validateUuid(v4.replace("a716", `${variant}716`))?.valid).toBe(true);
  });

  it.each([
    ["0", "NCS (legacy)"],
    ["7", "NCS (legacy)"],
    ["c", "Microsoft (legacy)"],
    ["d", "Microsoft (legacy)"],
    ["e", "Reserved"],
    ["f", "Reserved"],
  ])(
    "identifies non-RFC variant %s without decoding RFC fields",
    (digit, variant) => {
      const result = validateUuid(v4.replace("a716", `${digit}716`))!;
      expect(result).toMatchObject({ valid: false, variant });
      expect(result.version).toBeUndefined();
      expect(result.timestamp).toBeUndefined();
    },
  );

  it.each([
    ["0", "Nil"],
    ["f", "Max"],
  ])("accepts sentinel %s", (digit, special) => {
    const result = validateUuid(digit.repeat(32))!;
    expect(result).toMatchObject({ valid: true, special });
    expect(result.version).toBeUndefined();
    expect(result.timestamp).toBeUndefined();
  });

  // Published test vectors from RFC 9562, Appendix A.
  it.each([
    ["c232ab00-9414-11ec-b3c8-9f6bdeced846", 1],
    ["1ec9414c-232a-6b00-b3c8-9f6bdeced846", 6],
    ["017f22e2-79b0-7cc3-98c4-dc0c0c07398f", 7],
  ])("extracts the RFC timestamp from %s", (uuid, version) => {
    const result = validateUuid(uuid as string)!;
    expect(result).toMatchObject({
      valid: true,
      version,
      timestamp: "2022-02-22T19:22:22.000Z",
      unixMilliseconds: 1645557742000,
    });
    if (version !== 7)
      expect(result).toMatchObject({
        node: "9f:6b:de:ce:d8:46",
        clockSequence: 13256,
        timestampTicks: "138648505420000000",
      });
    else expect(result.node).toBeUndefined();
  });

  it("preserves sub-millisecond ticks and handles dates before the Unix epoch", () => {
    expect(validateUuid("13813fff-1dd2-11b2-8000-000000000000")).toMatchObject({
      unixMilliseconds: -1,
      timestamp: "1969-12-31T23:59:59.999Z",
      timestampTicks: "122192927999999999",
      clockSequence: 0,
    });
  });

  it("supports the Gregorian epoch and the maximum v7 timestamp", () => {
    expect(
      validateUuid("00000000-0000-1000-8000-000000000000")?.timestamp,
    ).toBe("1582-10-15T00:00:00.000Z");
    expect(
      validateUuid("ffffffff-ffff-7fff-bfff-ffffffffffff")?.unixMilliseconds,
    ).toBe(281474976710655);
  });

  it.each([2, 3, 4, 5, 8])("does not invent a timestamp for v%i", (version) => {
    expect(
      validateUuid(v4.replace("41d4", `${version}1d4`))?.timestamp,
    ).toBeUndefined();
  });
});
