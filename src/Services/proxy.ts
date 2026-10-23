export async function proxy(url: string) {
  const encodedUrl = encodeURIComponent(url);
  const res = await fetch(`${import.meta.env.VITE_FUNCTIONS_BASE_URL}.netlify/functions/proxy?url=${encodedUrl}`);
  const contentType = res.headers.get('Content-Type') || '';
  if (!res.ok || !contentType.startsWith('image/')) {
    throw new Error(`Failed to fetch image (status ${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return { arrayBuffer, contentType };
}
