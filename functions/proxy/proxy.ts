import { Handler } from '@netlify/functions'
import fetch from 'node-fetch';

export const handler: Handler = async (event, context) => {
  const { url } = event.queryStringParameters || {};
  if (!url) {
    return {
      statusCode: 400,
      body: 'Missing url parameter',
    };
  }
  const response = await fetch(url, {});
  const data = await response.buffer();
  const base64 = data.toString('base64');
  return {
    headers: {
      'Content-type': response.headers.get('Content-type'),
      'Content-Length': base64.length,
      'Access-Control-Allow-Origin': '*',
    },
    statusCode: 200,
    body: base64,
  };
}
