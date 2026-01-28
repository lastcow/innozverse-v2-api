// Test authentication endpoints
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const handler = require('./vercel-serverless.js');

async function makeRequest(method, path, body = null) {
  const bodyBuffer = body ? Buffer.from(JSON.stringify(body)) : Buffer.alloc(0);

  const mockReq = {
    method,
    url: path,
    headers: {
      'host': 'localhost:3000',
      'x-forwarded-proto': 'http',
      'x-forwarded-host': 'localhost:3000',
      'content-type': 'application/json'
    },
    json: async () => body,
    async *[Symbol.asyncIterator]() {
      if (body) {
        yield bodyBuffer;
      }
    }
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
    }
  };

  await handler(mockReq, mockRes);

  return {
    status: mockRes.statusCode,
    data: JSON.parse(mockRes.body)
  };
}

(async () => {
  console.log('\n' + '='.repeat(70));
  console.log('TESTING AUTHENTICATION ENDPOINTS');
  console.log('='.repeat(70));

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'password123';
  let accessToken = null;

  // Test 1: Register new user
  console.log('\n[TEST 1] Register new user');
  console.log(`Email: ${testEmail}`);
  try {
    const response = await makeRequest('POST', '/api/v1/auth/register', {
      email: testEmail,
      password: testPassword
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 201) {
      console.log('✅ Registration successful');
      console.log(`User ID: ${response.data.user.id}`);
      console.log(`Email: ${response.data.user.email}`);
      console.log(`Role: ${response.data.user.role}`);
      console.log(`Access Token: ${response.data.accessToken.substring(0, 50)}...`);
      accessToken = response.data.accessToken;
    } else {
      console.log('❌ Registration failed');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Try to register same user again (should fail)
  console.log('\n[TEST 2] Try to register same user again (should fail)');
  try {
    const response = await makeRequest('POST', '/api/v1/auth/register', {
      email: testEmail,
      password: testPassword
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 409) {
      console.log('✅ Correctly rejected duplicate registration');
      console.log(`Error: ${response.data.error}`);
    } else {
      console.log('❌ Should have rejected duplicate registration');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Login with valid credentials
  console.log('\n[TEST 3] Login with valid credentials');
  try {
    const response = await makeRequest('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: testPassword
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Login successful');
      console.log(`User ID: ${response.data.user.id}`);
      console.log(`Access Token: ${response.data.accessToken.substring(0, 50)}...`);
    } else {
      console.log('❌ Login failed');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Login with wrong password (should fail)
  console.log('\n[TEST 4] Login with wrong password (should fail)');
  try {
    const response = await makeRequest('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: 'wrongpassword'
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 401) {
      console.log('✅ Correctly rejected invalid credentials');
      console.log(`Error: ${response.data.error}`);
    } else {
      console.log('❌ Should have rejected invalid credentials');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 5: Login with existing seeded user
  console.log('\n[TEST 5] Login with existing seeded user');
  try {
    const response = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'admin@innozverse.com',
      password: 'admin123'
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Admin login successful');
      console.log(`User: ${response.data.user.email}`);
      console.log(`Role: ${response.data.user.role}`);
    } else {
      console.log('❌ Admin login failed');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('AUTHENTICATION TESTS COMPLETED');
  console.log('='.repeat(70) + '\n');
})();
