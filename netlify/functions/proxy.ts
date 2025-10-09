import { Handler } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  const { url } = event.queryStringParameters || {};
  if (!url) {
    return {
      statusCode: 400,
      body: 'Missing url parameter',
    };
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (error) {
    console.log('Error decoding URL:', url, error);
    return {
      statusCode: 400,
      body: 'Invalid URL parameter - malformed URI',
    };
  }

  const response = await fetch(decodedUrl, {});
  const arrayBuffer = await response.arrayBuffer();
  const data = Buffer.from(arrayBuffer);
  const base64 = data.toString('base64');
  const contentType = response.headers.get('Content-type') || '';
  return {
    headers: {
      'Content-type': contentType,
      'Content-Length': data.length,
      'Access-Control-Allow-Origin': '*',
    },
    isBase64Encoded: true,
    statusCode: 200,
    body: base64,
  };
}
