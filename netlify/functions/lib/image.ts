import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { IMAGE_EXTENSIONS } from '../../../src/shared/images';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type ImageData = { buffer: Buffer; contentType: string; extension: string };

/** IPv4 ranges an agent-supplied URL must not reach (SSRF guard). */
function isInternalIPv4(address: string) {
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

/** IPv4 address embedded in an IPv4-mapped IPv6 address (::ffff:a.b.c.d or ::ffff:hhhh:hhhh). */
function getMappedIPv4(address: string) {
  const dotted = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    return dotted[1];
  }
  const hex = address.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const [high, low] = [parseInt(hex[1], 16), parseInt(hex[2], 16)];
    return [high >> 8, high & 255, low >> 8, low & 255].join('.');
  }
  return undefined;
}

function isInternalIPv6(address: string) {
  const lower = address.toLowerCase();
  const mappedIPv4 = getMappedIPv4(lower);
  if (mappedIPv4) {
    return isInternalIPv4(mappedIPv4);
  }
  return (
    lower === '::1' || // loopback
    lower === '::' || // unspecified
    /^f[cd]/.test(lower) || // unique local fc00::/7
    /^fe[89ab]/.test(lower) // link-local fe80::/10
  );
}

function isInternalAddress(address: string) {
  return isIP(address) === 6 ? isInternalIPv6(address) : isInternalIPv4(address);
}

function fromBuffer(buffer: Buffer, declaredType: string): ImageData {
  const contentType = declaredType.split(';')[0].trim().toLowerCase();
  const extension = IMAGE_EXTENSIONS[contentType];
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
  if (!addresses.length || addresses.some(({ address }) => isInternalAddress(address))) {
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
