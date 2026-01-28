// Test student verification endpoints
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const handler = require('./vercel-serverless.js');

async function makeRequest(method, path, body = null, token = null) {
  const bodyBuffer = body ? Buffer.from(JSON.stringify(body)) : Buffer.alloc(0);

  const headers = {
    'host': 'localhost:3000',
    'x-forwarded-proto': 'http',
    'x-forwarded-host': 'localhost:3000',
    'content-type': 'application/json'
  };

  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  const mockReq = {
    method,
    url: path,
    headers,
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
  console.log('TESTING STUDENT VERIFICATION ENDPOINTS');
  console.log('='.repeat(70));

  let userToken = null;
  let adminToken = null;
  let verificationId = null;

  // Test 1: Register new user for testing
  console.log('\n[TEST 1] Register new test user');
  const testEmail = `test-student-${Date.now()}@example.com`;
  try {
    const response = await makeRequest('POST', '/api/v1/auth/register', {
      email: testEmail,
      password: 'password123'
    });

    if (response.status === 201) {
      console.log('✅ Test user registered');
      userToken = response.data.accessToken;
      console.log(`Email: ${testEmail}`);
    } else {
      console.log('❌ Registration failed');
      console.log(response.data);
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }

  // Test 2: Login as admin
  console.log('\n[TEST 2] Login as admin');
  try {
    const response = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'admin@innozverse.com',
      password: 'admin123'
    });

    if (response.status === 200) {
      console.log('✅ Admin login successful');
      adminToken = response.data.accessToken;
    } else {
      console.log('❌ Admin login failed');
      console.log(response.data);
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }

  // Test 3: Check initial verification status (should be NOT_SUBMITTED)
  console.log('\n[TEST 3] Check initial verification status');
  try {
    const response = await makeRequest('GET', '/api/v1/student/status', null, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Status retrieved');
      console.log(`Status: ${response.data.status || response.data.verification?.status}`);
    } else {
      console.log('❌ Failed to get status');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Submit verification with non-.edu email (should fail)
  console.log('\n[TEST 4] Try to verify with non-.edu email (should fail)');
  try {
    const response = await makeRequest('POST', '/api/v1/student/verify', {
      verificationMethod: 'EDU_EMAIL',
      eduEmail: 'test@example.com'
    }, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 400) {
      console.log('✅ Correctly rejected non-.edu email');
      console.log(`Error: ${response.data.error}`);
    } else {
      console.log('❌ Should have rejected non-.edu email');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 5: Submit verification with .edu email
  console.log('\n[TEST 5] Submit verification with .edu email');
  try {
    const response = await makeRequest('POST', '/api/v1/student/verify', {
      verificationMethod: 'EDU_EMAIL',
      eduEmail: 'student@university.edu'
    }, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 201) {
      console.log('✅ Verification submitted');
      verificationId = response.data.verification.id;
      console.log(`Verification ID: ${verificationId}`);
      console.log(`Status: ${response.data.verification.status}`);
      console.log(`EDU Email: ${response.data.verification.eduEmail}`);
    } else {
      console.log('❌ Failed to submit verification');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 6: Try to submit again (should fail - already pending)
  console.log('\n[TEST 6] Try to submit again (should fail - already pending)');
  try {
    const response = await makeRequest('POST', '/api/v1/student/verify', {
      verificationMethod: 'EDU_EMAIL',
      eduEmail: 'another@university.edu'
    }, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 400) {
      console.log('✅ Correctly rejected duplicate submission');
      console.log(`Error: ${response.data.error}`);
    } else {
      console.log('❌ Should have rejected duplicate submission');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 7: Check verification status (should be PENDING)
  console.log('\n[TEST 7] Check verification status');
  try {
    const response = await makeRequest('GET', '/api/v1/student/status', null, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Status retrieved');
      console.log(`Status: ${response.data.verification.status}`);
      console.log(`Method: ${response.data.verification.verificationMethod}`);
    } else {
      console.log('❌ Failed to get status');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 8: List pending verifications as admin
  console.log('\n[TEST 8] List pending verifications (admin)');
  try {
    const response = await makeRequest('GET', '/api/v1/admin/student-verifications?status=PENDING', null, adminToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Pending verifications retrieved');
      console.log(`Total pending: ${response.data.pagination.total}`);
      if (response.data.verifications.length > 0) {
        console.log(`First user: ${response.data.verifications[0].user.email}`);
      }
    } else {
      console.log('❌ Failed to get verifications');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 9: Try to approve as regular user (should fail)
  if (verificationId) {
    console.log('\n[TEST 9] Try to approve as regular user (should fail)');
    try {
      const response = await makeRequest('PUT', `/api/v1/admin/student-verifications/${verificationId}`, {
        status: 'APPROVED'
      }, userToken);

      console.log(`Status: ${response.status}`);
      if (response.status === 403) {
        console.log('✅ Correctly rejected non-admin');
        console.log(`Error: ${response.data.error}`);
      } else {
        console.log('❌ Should have rejected non-admin');
        console.log(response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 10: Approve verification as admin
  if (verificationId) {
    console.log('\n[TEST 10] Approve verification (admin)');
    try {
      const response = await makeRequest('PUT', `/api/v1/admin/student-verifications/${verificationId}`, {
        status: 'APPROVED',
        adminNotes: 'Valid .edu email confirmed'
      }, adminToken);

      console.log(`Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Verification approved');
        console.log(`Status: ${response.data.verification.status}`);
        console.log(`Admin Notes: ${response.data.verification.adminNotes}`);
        console.log(`Verified By: ${response.data.verification.verifiedBy.email}`);
      } else {
        console.log('❌ Failed to approve verification');
        console.log(response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 11: Check status after approval
  console.log('\n[TEST 11] Check status after approval');
  try {
    const response = await makeRequest('GET', '/api/v1/student/status', null, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Status retrieved');
      console.log(`Status: ${response.data.verification.status}`);
      console.log(`Verified At: ${response.data.verification.verifiedAt}`);
    } else {
      console.log('❌ Failed to get status');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 12: Submit manual upload verification
  console.log('\n[TEST 12] Submit manual upload verification (new user)');
  const manualTestEmail = `test-manual-${Date.now()}@example.com`;
  try {
    // Register new user
    const regResponse = await makeRequest('POST', '/api/v1/auth/register', {
      email: manualTestEmail,
      password: 'password123'
    });

    if (regResponse.status === 201) {
      const manualUserToken = regResponse.data.accessToken;

      // Submit manual verification
      const response = await makeRequest('POST', '/api/v1/student/verify', {
        verificationMethod: 'MANUAL_UPLOAD',
        proofUrl: 'https://example.com/student-id.jpg'
      }, manualUserToken);

      console.log(`Status: ${response.status}`);
      if (response.status === 201) {
        console.log('✅ Manual verification submitted');
        console.log(`Method: ${response.data.verification.verificationMethod}`);
        console.log(`Proof URL: ${response.data.verification.proofUrl}`);
      } else {
        console.log('❌ Failed to submit manual verification');
        console.log(response.data);
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('STUDENT VERIFICATION TESTS COMPLETED');
  console.log('='.repeat(70) + '\n');
})();
