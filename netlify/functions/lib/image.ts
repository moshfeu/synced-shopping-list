import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export type ImageData = { buffer: Buffer; contentType: string; extension: string };

function isPrivateAddress(address: string) {
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    return lower === '::1' || lower === '::' || /^f[cd]/.test(lower) || lower.startsWith('fe80');
  }
  // IPv4 ranges an agent-supplied URL must not reach (SSRF guard)
  const [a, b] = address.split('.').map(Number);
  return (
    a === 0 || // "this network"
    a === 10 || // private 10.0.0.0/8
    a === 127 || // loopback
    (a === 169 && b === 254) || // link-local, incl. the cloud metadata endpoint
    (a === 172 && b >= 16 && b <= 31) || // private 172.16.0.0/12
    (a === 192 && b === 168) || // private 192.168.0.0/16
    (a === 100 && b >= 64 && b <= 127) // carrier-grade NAT 100.64.0.0/10
  );
}

function fromBuffer(buffer: Buffer, declaredType: string): ImageData {
  const contentType = declaredType.split(';')[0].trim().toLowerCase();
  const extension = EXTENSIONS[contentType];
  if (!extension) {
    throw new Error(`Unsupported image type "${contentType}" (use jpeg, png, webp or gif)`);
  }
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`Image must be between 1 byte and ${MAX_IMAGE_BYTES / 1024 / 1024} MB`);
  }
  return { buffer, contentType, extension };
}

export function imageFromBase64(base64: string, mimeType: string) {
  const clean = base64.replace(/^data:[^,]*,/, '').replace(/\s/g, '');
  return fromBuffer(Buffer.from(clean, 'base64'), mimeType);
}

/** Fetches a public https image. Refuses private addresses and redirects so it can't reach internal services. */
export async function imageFromUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:') {
    throw new Error('Image URL must use https');
  }
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Image URL must point to a public host');
  }
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
    headers: { Accept: 'image/*', 'User-Agent': 'Mozilla/5.0 (compatible; synced-shopping-list)' },
  });
  if (!response.ok) {
    throw new Error(`Could not download the image (HTTP ${response.status}${response.status >= 300 && response.status < 400 ? ', redirects are not followed' : ''})`);
  }
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_IMAGE_BYTES) {
    throw new Error(`Image is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB`);
  }
  return fromBuffer(Buffer.from(await response.arrayBuffer()), response.headers.get('content-type') || '');
}
