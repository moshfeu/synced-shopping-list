import { getImageUrl } from './storage';

const CACHE_KEY = 'ssr';

export async function add(url: string, file?: ArrayBuffer) {
  if (!('caches' in window)) {
    return Promise.resolve();
  }
  const cache = await caches.open(CACHE_KEY);
  try {
    if (!file) {
      cache.add(getImageUrl(url));
      return;
    }
    return cache.put(
      url,
      new Response(file, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': file.byteLength.toString(),
        },
        status: 200,
      })
    );
  } catch (error) {
    console.log(error);
  }
}

export async function remove(url: string) {
  if (!('caches' in window)) {
    return;
  }
  const cache = await caches.open(CACHE_KEY);
  cache.delete(url);
}
