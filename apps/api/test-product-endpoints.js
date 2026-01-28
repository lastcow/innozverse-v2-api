// Test product endpoints
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
  console.log('TESTING PRODUCT ENDPOINTS');
  console.log('='.repeat(70));

  let adminToken = null;
  let createdProductId = null;

  // Test 1: Login as admin
  console.log('\n[TEST 1] Login as admin');
  try {
    const response = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'admin@innozverse.com',
      password: 'admin123'
    });

    if (response.status === 200) {
      console.log('✅ Admin login successful');
      adminToken = response.data.accessToken;
      console.log(`Token: ${adminToken.substring(0, 50)}...`);
    } else {
      console.log('❌ Admin login failed');
      console.log(response.data);
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }

  // Test 2: List products
  console.log('\n[TEST 2] List products');
  try {
    const response = await makeRequest('GET', '/api/v1/products');

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Products listed successfully');
      console.log(`Total products: ${response.data.pagination.total}`);
      console.log(`First product: ${response.data.products[0]?.name || 'None'}`);
    } else {
      console.log('❌ Failed to list products');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Create product without auth (should fail)
  console.log('\n[TEST 3] Try to create product without auth (should fail)');
  try {
    const response = await makeRequest('POST', '/api/v1/products', {
      name: 'Test Product',
      description: 'Test Description',
      basePrice: 99.99,
      type: 'LAPTOP'
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 401) {
      console.log('✅ Correctly rejected unauthorized request');
      console.log(`Error: ${response.data.error}`);
    } else {
      console.log('❌ Should have rejected unauthorized request');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Create product with admin auth
  console.log('\n[TEST 4] Create product with admin auth');
  try {
    const testProduct = {
      name: 'Test MacBook Pro',
      description: 'High-performance laptop for testing',
      basePrice: 2499.99,
      type: 'LAPTOP',
      imageUrls: ['https://example.com/image1.jpg'],
      properties: {
        processor: 'M3 Max',
        ram: '32GB',
        storage: '1TB SSD'
      },
      stock: 10,
      active: true
    };

    const response = await makeRequest('POST', '/api/v1/products', testProduct, adminToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 201) {
      console.log('✅ Product created successfully');
      createdProductId = response.data.product.id;
      console.log(`Product ID: ${createdProductId}`);
      console.log(`Product Name: ${response.data.product.name}`);
      console.log(`Product Price: $${response.data.product.basePrice}`);
    } else {
      console.log('❌ Failed to create product');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 5: Get single product
  if (createdProductId) {
    console.log('\n[TEST 5] Get single product');
    try {
      const response = await makeRequest('GET', `/api/v1/products/${createdProductId}`);

      console.log(`Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Product fetched successfully');
        console.log(`Name: ${response.data.product.name}`);
        console.log(`Type: ${response.data.product.type}`);
        console.log(`Price: $${response.data.product.basePrice}`);
      } else {
        console.log('❌ Failed to fetch product');
        console.log(response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 6: Update product
  if (createdProductId) {
    console.log('\n[TEST 6] Update product');
    try {
      const response = await makeRequest('PUT', `/api/v1/products/${createdProductId}`, {
        basePrice: 2299.99,
        description: 'Updated description - now on sale!',
        stock: 5
      }, adminToken);

      console.log(`Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Product updated successfully');
        console.log(`New Price: $${response.data.product.basePrice}`);
        console.log(`New Stock: ${response.data.product.stock}`);
        console.log(`New Description: ${response.data.product.description}`);
      } else {
        console.log('❌ Failed to update product');
        console.log(response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 7: Filter products by type
  console.log('\n[TEST 7] Filter products by type');
  try {
    const response = await makeRequest('GET', '/api/v1/products?type=LAPTOP');

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Products filtered successfully');
      console.log(`LAPTOP products found: ${response.data.products.length}`);
    } else {
      console.log('❌ Failed to filter products');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 8: Delete product
  if (createdProductId) {
    console.log('\n[TEST 8] Delete product');
    try {
      const response = await makeRequest('DELETE', `/api/v1/products/${createdProductId}`, null, adminToken);

      console.log(`Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Product deleted successfully');
        console.log(`Message: ${response.data.message}`);
      } else {
        console.log('❌ Failed to delete product');
        console.log(response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 9: Try to get deleted product (should fail)
  if (createdProductId) {
    console.log('\n[TEST 9] Try to get deleted product (should fail)');
    try {
      const response = await makeRequest('GET', `/api/v1/products/${createdProductId}`);

      console.log(`Status: ${response.status}`);
      if (response.status === 404) {
        console.log('✅ Correctly returned 404 for deleted product');
        console.log(`Error: ${response.data.error}`);
      } else {
        console.log('❌ Should have returned 404');
        console.log(response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('PRODUCT TESTS COMPLETED');
  console.log('='.repeat(70) + '\n');
})();
