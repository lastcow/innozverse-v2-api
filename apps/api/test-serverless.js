// Test serverless function locally
const handler = require('./api/index.js');

// Mock Vercel request
const mockReq = {
  method: 'GET',
  url: '/health',
  headers: {
    'host': 'localhost:3000',
    'x-forwarded-proto': 'http',
    'x-forwarded-host': 'localhost:3000'
  },
  [Symbol.asyncIterator]: async function* () {
    // No body for GET request
  }
};

// Mock Vercel response
const mockRes = {
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(key, value) {
    this.headers[key] = value;
  },
  end(data) {
    this.body = data;
    console.log('Status:', this.statusCode);
    console.log('Headers:', this.headers);
    console.log('Body:', this.body);
  }
};

// Test the handler
(async () => {
  try {
    console.log('Testing serverless function...');
    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('Error:', error);
  }
})();
