export async function proxy(url: string) {
  const res = await fetch(`${process.env.REACT_APP_FUNCTIONS_BASE_URL}.netlify/functions/proxy?url=${url}`);
  const arrayBuffer = await res.arrayBuffer()
  return arrayBuffer;
}