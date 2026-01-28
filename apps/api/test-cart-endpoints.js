// Test cart endpoints
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const handler = require('./vercel-serverless.js');

async function makeRequest(method, path, body = null, token = null, sessionId = null) {
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

  if (sessionId) {
    headers['x-session-id'] = sessionId;
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
  console.log('TESTING CART ENDPOINTS');
  console.log('='.repeat(70));

  let userToken = null;
  let productId = null;
  let cartItemId = null;
  const guestSessionId = `guest-${Date.now()}`;

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

  // Test 2: Get a product ID
  console.log('\n[TEST 2] Get product for testing');
  try {
    const response = await makeRequest('GET', '/api/v1/products?limit=1');

    if (response.status === 200 && response.data.products.length > 0) {
      productId = response.data.products[0].id;
      console.log('✅ Product found');
      console.log(`Product ID: ${productId}`);
      console.log(`Product: ${response.data.products[0].name}`);
    } else {
      console.log('❌ No products available');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }

  // Test 3: Get cart (authenticated user - should be empty)
  console.log('\n[TEST 3] Get empty cart (authenticated)');
  try {
    const response = await makeRequest('GET', '/api/v1/cart', null, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Cart retrieved successfully');
      console.log(`Cart ID: ${response.data.cart.id}`);
      console.log(`Item count: ${response.data.cart.itemCount}`);
      console.log(`Subtotal: $${response.data.cart.subtotal}`);
    } else {
      console.log('❌ Failed to get cart');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Add item to cart without auth/session (should fail)
  console.log('\n[TEST 4] Try to add item without auth/session (should fail)');
  try {
    const response = await makeRequest('POST', '/api/v1/cart/items', {
      productId,
      quantity: 2
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

  // Test 5: Add item to cart (authenticated user)
  console.log('\n[TEST 5] Add item to cart (authenticated)');
  try {
    const response = await makeRequest('POST', '/api/v1/cart/items', {
      productId,
      quantity: 2
    }, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 201) {
      console.log('✅ Item added to cart');
      cartItemId = response.data.cartItem.id;
      console.log(`Cart Item ID: ${cartItemId}`);
      console.log(`Product: ${response.data.cartItem.product.name}`);
      console.log(`Quantity: ${response.data.cartItem.quantity}`);
    } else {
      console.log('❌ Failed to add item');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 6: Get cart with items
  console.log('\n[TEST 6] Get cart with items');
  try {
    const response = await makeRequest('GET', '/api/v1/cart', null, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Cart retrieved successfully');
      console.log(`Item count: ${response.data.cart.itemCount}`);
      console.log(`Subtotal: $${response.data.cart.subtotal}`);
      console.log(`Items: ${response.data.cart.items.length}`);
    } else {
      console.log('❌ Failed to get cart');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 7: Add same item again (should increase quantity)
  console.log('\n[TEST 7] Add same item again (should increase quantity)');
  try {
    const response = await makeRequest('POST', '/api/v1/cart/items', {
      productId,
      quantity: 1
    }, userToken);

    console.log(`Status: ${response.status}`);
    if (response.status === 201) {
      console.log('✅ Quantity updated');
      console.log(`New Quantity: ${response.data.cartItem.quantity}`);
    } else {
      console.log('❌ Failed to update quantity');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 8: Update cart item quantity
  if (cartItemId) {
    console.log('\n[TEST 8] Update cart item quantity');
    try {
      const response = await makeRequest('PUT', `/api/v1/cart/items/${cartItemId}`, {
        quantity: 5
      }, userToken);

      console.log(`Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Cart item updated');
        console.log(`New Quantity: ${response.data.cartItem.quantity}`);
      } else {
        console.log('❌ Failed to update cart item');
        console.log(response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 9: Guest cart - Add item with session ID
  console.log('\n[TEST 9] Add item to guest cart (session-based)');
  try {
    const response = await makeRequest('POST', '/api/v1/cart/items', {
      productId,
      quantity: 1
    }, null, guestSessionId);

    console.log(`Status: ${response.status}`);
    if (response.status === 201) {
      console.log('✅ Item added to guest cart');
      console.log(`Product: ${response.data.cartItem.product.name}`);
      console.log(`Quantity: ${response.data.cartItem.quantity}`);
    } else {
      console.log('❌ Failed to add item to guest cart');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 10: Get guest cart
  console.log('\n[TEST 10] Get guest cart');
  try {
    const response = await makeRequest('GET', '/api/v1/cart', null, null, guestSessionId);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Guest cart retrieved');
      console.log(`Item count: ${response.data.cart.itemCount}`);
      console.log(`Subtotal: $${response.data.cart.subtotal}`);
    } else {
      console.log('❌ Failed to get guest cart');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 11: Remove item from cart
  if (cartItemId) {
    console.log('\n[TEST 11] Remove item from cart');
    try {
      const response = await makeRequest('DELETE', `/api/v1/cart/items/${cartItemId}`, null, userToken);

      console.log(`Status: ${response.status}`);
      if (response.status === 200) {
        console.log('✅ Item removed from cart');
        console.log(`Message: ${response.data.message}`);
      } else {
        console.log('❌ Failed to remove item');
        console.log(response.data);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 12: Clear guest cart
  console.log('\n[TEST 12] Clear guest cart');
  try {
    const response = await makeRequest('DELETE', '/api/v1/cart', null, null, guestSessionId);

    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Guest cart cleared');
      console.log(`Message: ${response.data.message}`);
    } else {
      console.log('❌ Failed to clear cart');
      console.log(response.data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('CART TESTS COMPLETED');
  console.log('='.repeat(70) + '\n');
})();
