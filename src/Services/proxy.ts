export async function proxy(url: string) {
  const encodedUrl = encodeURIComponent(url);
  const res = await fetch(`${import.meta.env.VITE_FUNCTIONS_BASE_URL}.netlify/functions/proxy?url=${encodedUrl}`);
  const arrayBuffer = await res.arrayBuffer()
  return arrayBuffer;
}
