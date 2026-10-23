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

  let response: Response;
  try {
    response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; synced-shopping-list)',
        Accept: 'image/*',
        Referer: new URL(decodedUrl).origin,
      },
    });
  } catch (error) {
    console.log('Error fetching URL:', decodedUrl, error);
    return {
      statusCode: 502,
      body: 'Failed to fetch the image',
    };
  }

  const contentType = response.headers.get('Content-type') || '';
  if (!response.ok || !contentType.startsWith('image/')) {
    return {
      statusCode: 502,
      body: `Not an image (status ${response.status}, type ${contentType})`,
    };
  }

  const arrayBuffer = await response.arrayBuffer();
  const data = Buffer.from(arrayBuffer);
  const base64 = data.toString('base64');
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
