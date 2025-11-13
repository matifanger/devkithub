import { Buffer } from 'buffer';
import { toASCII, toUnicode } from 'punycode/';

export type StringCodecId =
  | 'base64'
  | 'base64url'
  | 'base32'
  | 'rot13'
  | 'ascii85'
  | 'bin2hex'
  | 'htmlentities'
  | 'punycode'
  | 'quoted-printable'
  | 'urlencode'
  | 'uuencode';

export type StringCodec = {
  id: StringCodecId;
  label: string;
  encode: (input: string) => string;
  decode?: (input: string) => string;
  description?: string;
};

const isPrintable = (byte: number): boolean =>
  (byte >= 33 && byte <= 60) || (byte >= 62 && byte <= 126);

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const base32Lookup: Record<string, number> = base32Alphabet.split('').reduce(
  (acc, char, index) => {
    acc[char] = index;
    return acc;
  },
  {} as Record<string, number>
);

const encodeBase32 = (input: string): string => {
  const bytes = Buffer.from(input, 'utf8');
  let output = '';
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < bytes.length; i++) {
    buffer = (buffer << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      const index = (buffer >> (bits - 5)) & 31;
      output += base32Alphabet[index];
      bits -= 5;
    }
  }

  if (bits > 0) {
    const index = (buffer << (5 - bits)) & 31;
    output += base32Alphabet[index];
  }

  while (output.length % 8 !== 0) {
    output += '=';
  }

  return output;
};

const decodeBase32 = (input: string): string => {
  const sanitized = input.replace(/=+$/g, '').toUpperCase().replace(/\s+/g, '');
  let buffer = 0;
  let bits = 0;
  const bytes: number[] = [];

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    const value = base32Lookup[char];
    if (value === undefined) {
      throw new Error('Invalid Base32 character encountered');
    }

    buffer = (buffer << 5) | value;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return Buffer.from(bytes).toString('utf8');
};

const encodeBase64Url = (input: string): string =>
  Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const decodeBase64Url = (input: string): string => {
  const sanitized = input.replace(/-/g, '+').replace(/_/g, '/');
  const neededPadding = (4 - (sanitized.length % 4)) % 4;
  const padded = sanitized + '='.repeat(neededPadding);
  return Buffer.from(padded, 'base64').toString('utf8');
};

const rot13Transform = (input: string): string =>
  input.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const code = char.charCodeAt(0) - base;
    return String.fromCharCode(((code + 13) % 26) + base);
  });

const encodeAscii85 = (input: string): string => {
  const bytes = Buffer.from(input, 'utf8');
  if (bytes.length === 0) return '';

  let output = '';

  for (let i = 0; i < bytes.length; i += 4) {
    const chunk = bytes.subarray(i, i + 4);
    const padding = 4 - chunk.length;
    const padded = Buffer.alloc(4);
    chunk.copy(padded);

    let value = 0;
    for (let j = 0; j < 4; j++) {
      value = value * 256 + padded[j];
    }

    if (chunk.length === 4 && value === 0) {
      output += 'z';
      continue;
    }

    let encoded = '';
    for (let j = 0; j < 5; j++) {
      encoded = String.fromCharCode((value % 85) + 33) + encoded;
      value = Math.floor(value / 85);
    }

    if (padding > 0) {
      encoded = encoded.slice(0, encoded.length - padding);
    }

    output += encoded;
  }

  return output;
};

const decodeAscii85 = (input: string): string => {
  const sanitized = input.replace(/\s+/g, '').replace(/<~|~>/g, '');
  const bytes: number[] = [];
  let group = '';

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];

    if (char === 'z') {
      if (group.length !== 0) {
        throw new Error('Invalid "z" inside an ASCII85 group');
      }
      bytes.push(0, 0, 0, 0);
      continue;
    }

    const code = char.charCodeAt(0);
    if (code < 33 || code > 117) {
      throw new Error('Invalid ASCII85 character encountered');
    }

    group += char;

    if (group.length === 5) {
      let value = 0;
      for (let j = 0; j < 5; j++) {
        value = value * 85 + (group.charCodeAt(j) - 33);
      }

      bytes.push((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
      group = '';
    }
  }

  if (group.length > 0) {
    const padding = 5 - group.length;
    let value = 0;
    for (let j = 0; j < group.length; j++) {
      value = value * 85 + (group.charCodeAt(j) - 33);
    }

    for (let j = 0; j < padding; j++) {
      value = value * 85 + 84;
    }

    for (let j = 0; j < 4 - padding; j++) {
      bytes.push((value >>> ((3 - j) * 8)) & 0xff);
    }
  }

  return Buffer.from(bytes).toString('utf8');
};

const encodeQuotedPrintable = (input: string): string => {
  const bytes = Buffer.from(input, 'utf8');
  let result = '';
  let line = '';

  const flushLine = () => {
    result += `${line}=\r\n`;
    line = '';
  };

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];

    if (byte === 0x0d && bytes[i + 1] === 0x0a) {
      result += `${line}\r\n`;
      line = '';
      i++;
      continue;
    }

    let chunk: string;
    const atLineEnd = i + 1 === bytes.length || (bytes[i + 1] === 0x0d && bytes[i + 2] === 0x0a);

    if (isPrintable(byte) && byte !== 0x3d) {
      chunk = String.fromCharCode(byte);
    } else if ((byte === 0x09 || byte === 0x20) && !atLineEnd) {
      chunk = String.fromCharCode(byte);
    } else {
      chunk = `=${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    }

    if (line.length + chunk.length > 73) {
      flushLine();
    }

    line += chunk;
  }

  result += line;
  return result;
};

const decodeQuotedPrintable = (input: string): string => {
  const sanitized = input.replace(/=\r?\n/g, '');
  const bytes: number[] = [];

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    if (char === '=') {
      const hex = sanitized.substr(i + 1, 2);
      if (!/^[0-9A-Fa-f]{2}$/.test(hex)) {
        throw new Error('Invalid quoted-printable escape sequence');
      }
      bytes.push(parseInt(hex, 16));
      i += 2;
      continue;
    }
    bytes.push(char.charCodeAt(0));
  }

  return Buffer.from(bytes).toString('utf8');
};

const encodeValue = (value: number): string => {
  const charCode = (value & 0x3f) + 32;
  return String.fromCharCode(charCode === 32 ? 96 : charCode);
};

const decodeValue = (char: string): number => {
  if (char === '`') return 0;
  return (char.charCodeAt(0) - 32) & 0x3f;
};

const encodeUuencode = (input: string): string => {
  const bytes = Buffer.from(input, 'utf8');
  if (bytes.length === 0) {
    return '`';
  }

  const lines: string[] = [];

  for (let offset = 0; offset < bytes.length; offset += 45) {
    const chunk = bytes.subarray(offset, offset + 45);
    let line = encodeValue(chunk.length);

    for (let i = 0; i < chunk.length; i += 3) {
      const a = chunk[i];
      const b = i + 1 < chunk.length ? chunk[i + 1] : 0;
      const c = i + 2 < chunk.length ? chunk[i + 2] : 0;

      const c1 = a >> 2;
      const c2 = ((a << 4) | (b >> 4)) & 0x3f;
      const c3 = ((b << 2) | (c >> 6)) & 0x3f;
      const c4 = c & 0x3f;

      line += encodeValue(c1) + encodeValue(c2) + encodeValue(c3) + encodeValue(c4);
    }

    lines.push(line);
  }

  lines.push('`');
  return lines.join('\n');
};

const decodeUuencode = (input: string): string => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  const bytes: number[] = [];

  for (const line of lines) {
    if (!line.length) continue;
    const lengthChar = line[0];
    const length = decodeValue(lengthChar);

    if (length === 0) {
      break;
    }

    const encoded = line.slice(1);
    let produced = 0;

    for (let i = 0; i < encoded.length && produced < length; i += 4) {
      const c1 = decodeValue(encoded[i]);
      const c2 = decodeValue(encoded[i + 1] ?? '`');
      const c3 = decodeValue(encoded[i + 2] ?? '`');
      const c4 = decodeValue(encoded[i + 3] ?? '`');

      const b1 = (c1 << 2) | (c2 >> 4);
      const b2 = ((c2 & 0x0f) << 4) | (c3 >> 2);
      const b3 = ((c3 & 0x03) << 6) | c4;

      if (produced < length) {
        bytes.push(b1);
        produced++;
      }
      if (produced < length) {
        bytes.push(b2);
        produced++;
      }
      if (produced < length) {
        bytes.push(b3);
        produced++;
      }
    }
  }

  return Buffer.from(bytes).toString('utf8');
};

export const stringCodecs: readonly StringCodec[] = [
  {
    id: 'base64',
    label: 'Base64',
    description: 'Encode/decode text using Base64',
    encode: (input: string) => Buffer.from(input, 'utf8').toString('base64'),
    decode: (input: string) => Buffer.from(input.replace(/\s+/g, ''), 'base64').toString('utf8'),
  },
  {
    id: 'base64url',
    label: 'Base64 URL-safe',
    description: 'Base64 variant safe for URLs and filenames',
    encode: encodeBase64Url,
    decode: decodeBase64Url,
  },
  {
    id: 'base32',
    label: 'Base32',
    description: 'Encode/decode text using RFC 4648 Base32',
    encode: encodeBase32,
    decode: decodeBase32,
  },
  {
    id: 'rot13',
    label: 'ROT13',
    description: 'Simple ROT13 substitution cipher',
    encode: rot13Transform,
    decode: rot13Transform,
  },
  {
    id: 'ascii85',
    label: 'ASCII85 (Base85)',
    description: 'Adobe ASCII85 encoding',
    encode: encodeAscii85,
    decode: decodeAscii85,
  },
  {
    id: 'bin2hex',
    label: 'Binary ↔ Hex',
    description: 'Convert UTF-8 text to hexadecimal representation and back',
    encode: (input: string) => Buffer.from(input, 'utf8').toString('hex'),
    decode: (input: string) => {
      const sanitized = input.replace(/\s+/g, '');
      if (sanitized.length % 2 !== 0) {
        throw new Error('Hex string length must be even');
      }
      if (!/^[0-9a-fA-F]*$/.test(sanitized)) {
        throw new Error('Invalid hex characters detected');
      }
      return Buffer.from(sanitized, 'hex').toString('utf8');
    },
  },
  {
    id: 'htmlentities',
    label: 'HTML Entities',
    description: 'Escape or unescape HTML entities',
    encode: (input: string) => {
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    },
    decode: (input: string) => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = input;
      return textarea.value;
    },
  },
  {
    id: 'punycode',
    label: 'Punycode',
    description: 'Convert internationalized domain names to/from Punycode',
    encode: (input: string) => toASCII(input),
    decode: (input: string) => toUnicode(input),
  },
  {
    id: 'quoted-printable',
    label: 'Quoted-printable',
    description: 'Encode or decode MIME quoted-printable text',
    encode: encodeQuotedPrintable,
    decode: decodeQuotedPrintable,
  },
  {
    id: 'urlencode',
    label: 'URL Encode',
    description: 'Encode or decode URL components',
    encode: (input: string) => encodeURIComponent(input),
    decode: (input: string) => decodeURIComponent(input.replace(/\+/g, ' ')),
  },
  {
    id: 'uuencode',
    label: 'UUEncode',
    description: 'Encode or decode uuencoded content',
    encode: encodeUuencode,
    decode: decodeUuencode,
  },
];
