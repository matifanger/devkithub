export type HashAlgorithm = {
  id: string;
  label: string;
  supported: boolean;
  note?: string;
};

export type HashAlgorithmGroup = {
  label: string;
  algorithms: readonly HashAlgorithm[];
};

export const supportedHashAlgorithms = new Set<string>([
  'md2',
  'md4',
  'md5',
  'sha1',
  'sha224',
  'sha256',
  'sha384',
  'sha512',
  'sha3-224',
  'sha3-256',
  'sha3-384',
  'sha3-512',
  'keccak-224',
  'keccak-256',
  'keccak-384',
  'keccak-512',
  'ripemd160',
  'whirlpool',
  'blake2b',
  'blake2s',
  'blake3',
  'sm3',
  'adler32',
  'crc32',
  'crc32b',
  'crc32c',
  'crc64',
  'fnv132',
  'fnv1a32',
  'fnv164',
  'fnv1a64',
  'joaat',
  'murmur3a',
  'murmur3c',
  'murmur3f',
  'xxh32',
  'xxh64',
  'xxh3',
  'xxh128',
  'shake128',
  'shake256',
]);

export const hashAlgorithmGroups: readonly HashAlgorithmGroup[] = [
  {
    label: 'MD Family',
    algorithms: [
      { id: 'md2', label: 'MD2', supported: true },
      { id: 'md4', label: 'MD4', supported: true },
      { id: 'md5', label: 'MD5', supported: true },
    ],
  },
  {
    label: 'SHA-1 / SHA-2',
    algorithms: [
      { id: 'sha1', label: 'SHA-1', supported: true },
      { id: 'sha224', label: 'SHA-224', supported: true },
      { id: 'sha256', label: 'SHA-256', supported: true },
      { id: 'sha384', label: 'SHA-384', supported: true },
      { id: 'sha512', label: 'SHA-512', supported: true },
    ],
  },
  {
    label: 'SHA-3',
    algorithms: [
      { id: 'sha3-224', label: 'SHA3-224', supported: true },
      { id: 'sha3-256', label: 'SHA3-256', supported: true },
      { id: 'sha3-384', label: 'SHA3-384', supported: true },
      { id: 'sha3-512', label: 'SHA3-512', supported: true },
    ],
  },
  {
    label: 'Keccak',
    algorithms: [
      { id: 'keccak-224', label: 'Keccak-224', supported: true },
      { id: 'keccak-256', label: 'Keccak-256', supported: true },
      { id: 'keccak-384', label: 'Keccak-384', supported: true },
      { id: 'keccak-512', label: 'Keccak-512', supported: true },
    ],
  },
  {
    label: 'SHAKE (XOF)',
    algorithms: [
      { id: 'shake128', label: 'SHAKE128 (256-bit)', supported: true },
      { id: 'shake256', label: 'SHAKE256 (512-bit)', supported: true },
    ],
  },
  {
    label: 'RIPEMD',
    algorithms: [{ id: 'ripemd160', label: 'RIPEMD-160', supported: true }],
  },
  {
    label: 'BLAKE & SM Series',
    algorithms: [
      { id: 'blake2b', label: 'BLAKE2b', supported: true },
      { id: 'blake2s', label: 'BLAKE2s', supported: true },
      { id: 'blake3', label: 'BLAKE3', supported: true },
      { id: 'sm3', label: 'SM3', supported: true },
      { id: 'whirlpool', label: 'Whirlpool', supported: true },
    ],
  },
  {
    label: 'Checksums',
    algorithms: [
      { id: 'adler32', label: 'Adler-32', supported: true },
      { id: 'crc32', label: 'CRC-32', supported: true },
      { id: 'crc32b', label: 'CRC-32B', supported: true },
      { id: 'crc32c', label: 'CRC-32C', supported: true },
      { id: 'crc64', label: 'CRC-64', supported: true },
    ],
  },
  {
    label: 'Non-cryptographic',
    algorithms: [
      { id: 'fnv132', label: 'FNV-1 32-bit', supported: true },
      { id: 'fnv1a32', label: 'FNV-1a 32-bit', supported: true },
      { id: 'fnv164', label: 'FNV-1 64-bit', supported: true },
      { id: 'fnv1a64', label: 'FNV-1a 64-bit', supported: true },
      { id: 'joaat', label: 'Jenkins (JOAAT)', supported: true },
      { id: 'murmur3a', label: 'Murmur3 x86 32', supported: true },
      { id: 'murmur3c', label: 'Murmur3 x86 128', supported: true },
      { id: 'murmur3f', label: 'Murmur3 x64 128', supported: true },
      { id: 'xxh32', label: 'xxHash32', supported: true },
      { id: 'xxh64', label: 'xxHash64', supported: true },
      { id: 'xxh3', label: 'xxHash3', supported: true },
      { id: 'xxh128', label: 'xxHash128', supported: true },
    ],
  },
];
