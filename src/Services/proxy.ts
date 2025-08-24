export async function proxy(url: string) {
  const res = await fetch(`${import.meta.env.VITE_FUNCTIONS_BASE_URL}.netlify/functions/proxy?url=${url}`);
  const arrayBuffer = await res.arrayBuffer()
  return arrayBuffer;
}