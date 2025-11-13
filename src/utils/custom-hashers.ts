/* eslint-disable @typescript-eslint/no-var-requires */
const textEncoder: TextEncoder =
  typeof TextEncoder !== 'undefined'
    ? new TextEncoder()
    : new (require('util').TextEncoder)();
/* eslint-enable @typescript-eslint/no-var-requires */

const FNV_OFFSET_32 = 0x811c9dc5;
const FNV_PRIME_32 = 0x01000193;

const FNV_OFFSET_64 = 0xcbf29ce484222325n;
const FNV_PRIME_64 = 0x100000001b3n;
const FNV_64_MASK = 0xffffffffffffffffn;

const CRC32C_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc >>>= 1;
      }
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

const CRC32C_REVERSED_POLY = 0x82f63b78;
const CRC32C_LOOKUP = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) !== 0 ? (crc >>> 1) ^ CRC32C_REVERSED_POLY : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

const toUint8 = (input: string | Uint8Array): Uint8Array =>
  typeof input === 'string' ? textEncoder.encode(input) : input;

const rotl32 = (value: number, shift: number): number =>
  ((value << shift) | (value >>> (32 - shift))) >>> 0;

const rotl64 = (value: bigint, shift: number): bigint => {
  const s = BigInt(shift);
  return ((value << s) | (value >> (64n - s))) & FNV_64_MASK;
};

const fmix32 = (hash: number): number => {
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
};

const fmix64 = (hash: bigint): bigint => {
  hash ^= hash >> 33n;
  hash = (hash * 0xff51afd7ed558ccdn) & FNV_64_MASK;
  hash ^= hash >> 33n;
  hash = (hash * 0xc4ceb9fe1a85ec53n) & FNV_64_MASK;
  hash ^= hash >> 33n;
  return hash & FNV_64_MASK;
};

const toHex32 = (value: number): string => value.toString(16).padStart(8, '0');

const toHex64 = (value: bigint): string =>
  value.toString(16).padStart(16, '0');

const combine128 = (parts: number[]): string =>
  parts.map((part) => toHex32(part >>> 0)).join('');

const combine128BigInt = (parts: [bigint, bigint]): string =>
  toHex64(parts[0]) + toHex64(parts[1]);

const getUint32 = (data: Uint8Array, index: number): number =>
  (data[index] |
    (data[index + 1] << 8) |
    (data[index + 2] << 16) |
    (data[index + 3] << 24)) >>>
  0;

const getUint64 = (data: Uint8Array, index: number): bigint => {
  let result = 0n;
  for (let i = 0; i < 8; i++) {
    result |= BigInt(data[index + i]) << (BigInt(i) * 8n);
  }
  return result;
};

export const fnv132 = (input: string | Uint8Array): string => {
  const data = toUint8(input);
  let hash = FNV_OFFSET_32 >>> 0;
  for (let i = 0; i < data.length; i++) {
    hash = Math.imul(hash, FNV_PRIME_32) >>> 0;
    hash ^= data[i];
  }
  return toHex32(hash);
};

export const fnv1a32 = (input: string | Uint8Array): string => {
  const data = toUint8(input);
  let hash = FNV_OFFSET_32 >>> 0;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, FNV_PRIME_32) >>> 0;
  }
  return toHex32(hash);
};

export const fnv164 = (input: string | Uint8Array): string => {
  const data = toUint8(input);
  let hash = FNV_OFFSET_64;
  for (let i = 0; i < data.length; i++) {
    hash = (hash * FNV_PRIME_64) & FNV_64_MASK;
    hash ^= BigInt(data[i]);
  }
  return toHex64(hash);
};

export const fnv1a64 = (input: string | Uint8Array): string => {
  const data = toUint8(input);
  let hash = FNV_OFFSET_64;
  for (let i = 0; i < data.length; i++) {
    hash ^= BigInt(data[i]);
    hash = (hash * FNV_PRIME_64) & FNV_64_MASK;
  }
  return toHex64(hash);
};

export const joaat = (input: string | Uint8Array): string => {
  const data = toUint8(input);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash += data[i];
    hash &= 0xffffffff;
    hash += hash << 10;
    hash &= 0xffffffff;
    hash ^= hash >>> 6;
  }
  hash += hash << 3;
  hash &= 0xffffffff;
  hash ^= hash >>> 11;
  hash += hash << 15;
  hash &= 0xffffffff;
  return toHex32(hash >>> 0);
};

export const murmur3a = (input: string | Uint8Array, seed = 0): string => {
  const data = toUint8(input);
  const length = data.length;
  const blockCount = Math.floor(length / 4);

  let h1 = seed >>> 0;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  for (let i = 0; i < blockCount; i++) {
    let k1 =
      data[i * 4] |
      (data[i * 4 + 1] << 8) |
      (data[i * 4 + 2] << 16) |
      (data[i * 4 + 3] << 24);

    k1 = Math.imul(k1, c1);
    k1 = rotl32(k1, 15);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = rotl32(h1, 13);
    h1 = (Math.imul(h1, 5) + 0xe6546b64) >>> 0;
  }

  let k1 = 0;
  switch (length & 3) {
    case 3:
      k1 ^= data[blockCount * 4 + 2] << 16;
    // fallthrough
    case 2:
      k1 ^= data[blockCount * 4 + 1] << 8;
    // fallthrough
    case 1:
      k1 ^= data[blockCount * 4];
      k1 = Math.imul(k1, c1);
      k1 = rotl32(k1, 15);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
      break;
    default:
  }

  h1 ^= length;
  h1 = fmix32(h1);

  return toHex32(h1);
};

export const murmur3c = (input: string | Uint8Array, seed = 0): string => {
  const data = toUint8(input);
  const length = data.length;
  const blockCount = Math.floor(length / 16);

  let h1 = seed >>> 0;
  let h2 = seed >>> 0;
  let h3 = seed >>> 0;
  let h4 = seed >>> 0;

  const c1 = 0x239b961b;
  const c2 = 0xab0e9789;
  const c3 = 0x38b34ae5;
  const c4 = 0xa1e38b93;

  for (let block = 0; block < blockCount; block++) {
    const offset = block * 16;
    let k1 = getUint32(data, offset);
    let k2 = getUint32(data, offset + 4);
    let k3 = getUint32(data, offset + 8);
    let k4 = getUint32(data, offset + 12);

    k1 = Math.imul(k1, c1);
    k1 = rotl32(k1, 15);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
    h1 = rotl32(h1, 19);
    h1 = (h1 + h2) >>> 0;
    h1 = (Math.imul(h1, 5) + 0x561ccd1b) >>> 0;

    k2 = Math.imul(k2, c2);
    k2 = rotl32(k2, 16);
    k2 = Math.imul(k2, c3);
    h2 ^= k2;
    h2 = rotl32(h2, 17);
    h2 = (h2 + h3) >>> 0;
    h2 = (Math.imul(h2, 5) + 0x0bcaa747) >>> 0;

    k3 = Math.imul(k3, c3);
    k3 = rotl32(k3, 17);
    k3 = Math.imul(k3, c4);
    h3 ^= k3;
    h3 = rotl32(h3, 15);
    h3 = (h3 + h4) >>> 0;
    h3 = (Math.imul(h3, 5) + 0x96cd1c35) >>> 0;

    k4 = Math.imul(k4, c4);
    k4 = rotl32(k4, 18);
    k4 = Math.imul(k4, c1);
    h4 ^= k4;
    h4 = rotl32(h4, 13);
    h4 = (h4 + h1) >>> 0;
    h4 = (Math.imul(h4, 5) + 0x32ac3b17) >>> 0;
  }

  const tailOffset = blockCount * 16;
  let k1 = 0;
  let k2 = 0;
  let k3 = 0;
  let k4 = 0;

  switch (length & 15) {
    case 15:
      k4 ^= data[tailOffset + 14] << 16;
      /* falls through */
    case 14:
      k4 ^= data[tailOffset + 13] << 8;
      /* falls through */
    case 13:
      k4 ^= data[tailOffset + 12];
      k4 = Math.imul(k4, c4);
      k4 = rotl32(k4, 18);
      k4 = Math.imul(k4, c1);
      h4 ^= k4;
      /* falls through */
    case 12:
      k3 ^= data[tailOffset + 11] << 24;
      /* falls through */
    case 11:
      k3 ^= data[tailOffset + 10] << 16;
      /* falls through */
    case 10:
      k3 ^= data[tailOffset + 9] << 8;
      /* falls through */
    case 9:
      k3 ^= data[tailOffset + 8];
      k3 = Math.imul(k3, c3);
      k3 = rotl32(k3, 17);
      k3 = Math.imul(k3, c4);
      h3 ^= k3;
      /* falls through */
    case 8:
      k2 ^= data[tailOffset + 7] << 24;
      /* falls through */
    case 7:
      k2 ^= data[tailOffset + 6] << 16;
      /* falls through */
    case 6:
      k2 ^= data[tailOffset + 5] << 8;
      /* falls through */
    case 5:
      k2 ^= data[tailOffset + 4];
      k2 = Math.imul(k2, c2);
      k2 = rotl32(k2, 16);
      k2 = Math.imul(k2, c3);
      h2 ^= k2;
      /* falls through */
    case 4:
      k1 ^= data[tailOffset + 3] << 24;
      /* falls through */
    case 3:
      k1 ^= data[tailOffset + 2] << 16;
      /* falls through */
    case 2:
      k1 ^= data[tailOffset + 1] << 8;
      /* falls through */
    case 1:
      k1 ^= data[tailOffset];
      k1 = Math.imul(k1, c1);
      k1 = rotl32(k1, 15);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
      break;
    default:
  }

  h1 ^= length;
  h2 ^= length;
  h3 ^= length;
  h4 ^= length;

  h1 = (h1 + h2 + h3 + h4) >>> 0;
  h2 = (h2 + h1) >>> 0;
  h3 = (h3 + h1) >>> 0;
  h4 = (h4 + h1) >>> 0;

  h1 = fmix32(h1);
  h2 = fmix32(h2);
  h3 = fmix32(h3);
  h4 = fmix32(h4);

  h1 = (h1 + h2 + h3 + h4) >>> 0;
  h2 = (h2 + h1) >>> 0;
  h3 = (h3 + h1) >>> 0;
  h4 = (h4 + h1) >>> 0;

  return combine128([h1, h2, h3, h4]);
};

export const murmur3f = (input: string | Uint8Array, seed = 0): string => {
  const data = toUint8(input);
  const length = data.length;
  const blockCount = Math.floor(length / 16);

  let h1 = BigInt(seed) & FNV_64_MASK;
  let h2 = BigInt(seed) & FNV_64_MASK;

  const c1 = 0x87c37b91114253d5n;
  const c2 = 0x4cf5ad432745937fn;

  for (let block = 0; block < blockCount; block++) {
    const offset = block * 16;
    let k1 = getUint64(data, offset);
    let k2 = getUint64(data, offset + 8);

    k1 = (k1 * c1) & FNV_64_MASK;
    k1 = rotl64(k1, 31);
    k1 = (k1 * c2) & FNV_64_MASK;
    h1 ^= k1;

    h1 = rotl64(h1, 27);
    h1 = (h1 + h2) & FNV_64_MASK;
    h1 = (h1 * 5n + 0x52dce729n) & FNV_64_MASK;

    k2 = (k2 * c2) & FNV_64_MASK;
    k2 = rotl64(k2, 33);
    k2 = (k2 * c1) & FNV_64_MASK;
    h2 ^= k2;

    h2 = rotl64(h2, 31);
    h2 = (h2 + h1) & FNV_64_MASK;
    h2 = (h2 * 5n + 0x38495ab5n) & FNV_64_MASK;
  }

  const tailOffset = blockCount * 16;
  let k1 = 0n;
  let k2 = 0n;

  switch (length & 15) {
    case 15:
      k2 ^= BigInt(data[tailOffset + 14]) << 48n;
      /* falls through */
    case 14:
      k2 ^= BigInt(data[tailOffset + 13]) << 40n;
      /* falls through */
    case 13:
      k2 ^= BigInt(data[tailOffset + 12]) << 32n;
      /* falls through */
    case 12:
      k2 ^= BigInt(data[tailOffset + 11]) << 24n;
      /* falls through */
    case 11:
      k2 ^= BigInt(data[tailOffset + 10]) << 16n;
      /* falls through */
    case 10:
      k2 ^= BigInt(data[tailOffset + 9]) << 8n;
      /* falls through */
    case 9:
      k2 ^= BigInt(data[tailOffset + 8]);
      k2 = (k2 * c2) & FNV_64_MASK;
      k2 = rotl64(k2, 33);
      k2 = (k2 * c1) & FNV_64_MASK;
      h2 ^= k2;
      /* falls through */
    case 8:
      k1 ^= BigInt(data[tailOffset + 7]) << 56n;
      /* falls through */
    case 7:
      k1 ^= BigInt(data[tailOffset + 6]) << 48n;
      /* falls through */
    case 6:
      k1 ^= BigInt(data[tailOffset + 5]) << 40n;
      /* falls through */
    case 5:
      k1 ^= BigInt(data[tailOffset + 4]) << 32n;
      /* falls through */
    case 4:
      k1 ^= BigInt(data[tailOffset + 3]) << 24n;
      /* falls through */
    case 3:
      k1 ^= BigInt(data[tailOffset + 2]) << 16n;
      /* falls through */
    case 2:
      k1 ^= BigInt(data[tailOffset + 1]) << 8n;
      /* falls through */
    case 1:
      k1 ^= BigInt(data[tailOffset]);
      k1 = (k1 * c1) & FNV_64_MASK;
      k1 = rotl64(k1, 31);
      k1 = (k1 * c2) & FNV_64_MASK;
      h1 ^= k1;
      break;
    default:
  }

  const bigLength = BigInt(length);
  h1 ^= bigLength;
  h2 ^= bigLength;

  h1 = (h1 + h2) & FNV_64_MASK;
  h2 = (h2 + h1) & FNV_64_MASK;

  h1 = fmix64(h1);
  h2 = fmix64(h2);

  h1 = (h1 + h2) & FNV_64_MASK;
  h2 = (h2 + h1) & FNV_64_MASK;

  return combine128BigInt([h1, h2]);
};

export const crc32 = (input: string | Uint8Array): string => {
  const data = toUint8(input);
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    const index = (crc ^ byte) & 0xff;
    crc = (crc >>> 8) ^ CRC32C_TABLE[index];
  }
  crc = (~crc) >>> 0;
  return toHex32(crc);
};

export const crc32c = (input: string | Uint8Array): string => {
  const data = toUint8(input);
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    const index = (crc ^ byte) & 0xff;
    crc = (crc >>> 8) ^ CRC32C_LOOKUP[index];
  }
  crc = (~crc) >>> 0;
  return toHex32(crc);
};

