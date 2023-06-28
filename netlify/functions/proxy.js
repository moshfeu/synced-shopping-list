// netlify function to fetch image from url and return it as base64
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { url } = event.queryStringParameters;
  const response = await fetch(url);
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