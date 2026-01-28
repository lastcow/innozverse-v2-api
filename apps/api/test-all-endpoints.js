// Test all endpoints locally with .env loaded
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const handler = require('./vercel-serverless.js');

async function testEndpoint(path, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${description}`);
  console.log(`Path: ${path}`);
  console.log('='.repeat(60));

  const mockReq = {
    method: 'GET',
    url: path,
    headers: {
      'host': 'localhost:3000',
      'x-forwarded-proto': 'http',
      'x-forwarded-host': 'localhost:3000'
    },
    [Symbol.asyncIterator]: async function* () {}
  };

  const mockRes = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(data) {
      this.body = data;
      console.log(`Status: ${this.statusCode}`);
      try {
        const json = JSON.parse(this.body);
        console.log('Response:', JSON.stringify(json, null, 2));
      } catch {
        console.log('Response:', this.body);
      }
    }
  };

  try {
    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

(async () => {
  await testEndpoint('/health', 'Health Check');
  await testEndpoint('/test/env', 'Environment Variables');
  await testEndpoint('/test/jwt', 'JWT Generation & Verification');
  await testEndpoint('/test/db', 'Database Connectivity');

  console.log('\n' + '='.repeat(60));
  console.log('All tests completed');
  console.log('='.repeat(60));
})();
