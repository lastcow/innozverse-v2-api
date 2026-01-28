// Test order endpoints
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
  console.log('TESTING ORDER ENDPOINTS');
  console.log('='.repeat(70));

  let userToken = null;
  let adminToken = null;
  let productId = null;
  let orderId = null;

  // Test 1: Login as user
  console.log('\n[TEST 1] Login as user');
  try {
    const response = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'user@example.com',
      password: 'user123'
    });

    if (response.status === 200) {
      console.log('✅ User login successful');
      userToken = response.data.accessToken;
    } else {
      console.log('❌ User login failed');
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

  // Test 3: Get a product
  console.log('\n[TEST 3] Get product for testing');
  try {
    const response = await makeRequest('GET', '/api/v1/products?limit=1');

    if (response.status === 200 && response.data.products.length > 0) {
      productId = response.data.products[0].id;
      console.log('✅ Product found');
      console.log(`Product: ${response.data.products[0].name}`);
    } else {
      console.log('❌ No products available');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }

  // Test 4: Try to create order with empty cart (should fail)
  console.log('\n[TEST 4] Try to create order with empty cart (should fail)');
  try {
    const response = await makeRequest('POST', '/api/v1/orders', null, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 400) {
      console.log('✅ Correctly rejected empty cart');
      console.log(`Error: ${response.data.error}`);
    } else {
      console.log('❌ Should have rejected empty cart');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 5: Add item to cart
  console.log('\n[TEST 5] Add item to cart for user');
  try {
    const response = await makeRequest('POST', '/api/v1/cart/items', {
      productId,
      quantity: 2
    }, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 201) {
      console.log('✅ Item added to cart');
      console.log(`Product: ${response.data.cartItem.product.name}`);
      console.log(`Quantity: ${response.data.cartItem.quantity}`);
    } else {
      console.log('❌ Failed to add item');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 6: Create order from cart
  console.log('\n[TEST 6] Create order from cart');
  try {
    const response = await makeRequest('POST', '/api/v1/orders', null, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 201) {
      console.log('✅ Order created successfully');
      orderId = response.data.order.id;
      console.log(`Order ID: ${orderId}`);
      console.log(`Status: ${response.data.order.status}`);
      console.log(`Subtotal: $${response.data.order.subtotal}`);
      console.log(`Total: $${response.data.order.total}`);
      console.log(`Items: ${response.data.order.items.length}`);
    } else {
      console.log('❌ Failed to create order');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 7: Get user's orders
  console.log('\n[TEST 7] Get user\'s orders');
  try {
    const response = await makeRequest('GET', '/api/v1/orders', null, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Orders retrieved successfully');
      console.log(`Total orders: ${response.data.pagination.total}`);
      console.log(`Orders on page: ${response.data.orders.length}`);
    } else {
      console.log('❌ Failed to get orders');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 8: Get single order
  if (orderId) {
    console.log('\n[TEST 8] Get single order');
    try {
      const response = await makeRequest('GET', `/api/v1/orders/${orderId}`, null, userToken);

      console.log(`Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Order retrieved successfully');
        console.log(`Order ID: ${response.data.order.id}`);
        console.log(`Status: ${response.data.order.status}`);
        console.log(`Total: $${response.data.order.total}`);
      } else {
        console.log('❌ Failed to get order');
        console.log(response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 9: Get all orders as admin
  console.log('\n[TEST 9] Get all orders (admin)');
  try {
    const response = await makeRequest('GET', '/api/v1/admin/orders', null, adminToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Admin orders retrieved successfully');
      console.log(`Total orders: ${response.data.pagination.total}`);
      console.log(`Orders on page: ${response.data.orders.length}`);
      if (response.data.orders.length > 0) {
        console.log(`First order user: ${response.data.orders[0].user.email}`);
      }
    } else {
      console.log('❌ Failed to get admin orders');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 10: Update order status as admin
  if (orderId) {
    console.log('\n[TEST 10] Update order status (admin)');
    try {
      const response = await makeRequest('PUT', `/api/v1/admin/orders/${orderId}/status`, {
        status: 'PROCESSING'
      }, adminToken);

      console.log(`Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Order status updated');
        console.log(`New Status: ${response.data.order.status}`);
      } else {
        console.log('❌ Failed to update order status');
        console.log(response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 11: Try to update order status as regular user (should fail)
  if (orderId) {
    console.log('\n[TEST 11] Try to update order status as user (should fail)');
    try {
      const response = await makeRequest('PUT', `/api/v1/admin/orders/${orderId}/status`, {
        status: 'SHIPPED'
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

  // Test 12: Filter orders by status (admin)
  console.log('\n[TEST 12] Filter orders by status (admin)');
  try {
    const response = await makeRequest('GET', '/api/v1/admin/orders?status=PROCESSING', null, adminToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Filtered orders retrieved');
      console.log(`PROCESSING orders: ${response.data.orders.length}`);
    } else {
      console.log('❌ Failed to filter orders');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('ORDER TESTS COMPLETED');
  console.log('='.repeat(70) + '\n');
})();
