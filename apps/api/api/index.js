// Vercel serverless function entry point
const app = require('../dist/index.js').default;

// Export the fetch handler for Vercel
module.exports = async (req, res) => {
  const request = new Request(new URL(req.url || '/', `https://${req.headers.host}`), {
    method: req.method,
    headers: req.headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
  });

  const response = await app.fetch(request);

  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = await response.text();
  res.end(body);
};
