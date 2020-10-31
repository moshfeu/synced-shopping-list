const CACHE_KEY = 'ssr';

navigator.serviceWorker.register('/sw-cache.js').then(console.log);

export async function add(url: string, file: ArrayBuffer) {
  try {
    console.log(file);
    const cache = await caches.open(CACHE_KEY);
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
  const cache = await caches.open(CACHE_KEY);
  cache.delete(url);
}
