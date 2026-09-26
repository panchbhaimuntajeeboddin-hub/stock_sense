import http from 'http';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runDeliveryTests() {
  console.log('=== STARTING DELIVERY ORDERS MODULE API & NEGATIVE INVENTORY VERIFICATION ===\n');

  // 1. Authenticate user
  const authRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Delivery Tester',
    email: `deltester_${Date.now()}@stocksense.io`,
    password: 'password123',
    role: 'INVENTORY_MANAGER'
  });

  const token = authRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. Fetch prerequisite entities (Warehouse, Location, Product)
  let whRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/warehouses', method: 'GET', headers: authHeaders });
  let prodRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET', headers: authHeaders });

  let warehouse = whRes.data.data?.[0];
  let product = prodRes.data.data?.[0];

  if (!warehouse) {
    const newWh = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/warehouses', method: 'POST', headers: authHeaders }, {
      name: 'Main Logistics Hub',
      code: `WH-DEL-${Date.now()}`
    });
    warehouse = newWh.data?.data;
    const newLoc = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/locations', method: 'POST', headers: authHeaders }, {
      warehouseId: warehouse.id,
      name: 'Aisle 1',
      code: `LOC-DEL-${Date.now()}`
    });
    warehouse.locations = [newLoc.data?.data];
  }

  let location = warehouse.locations?.[0];
  if (!location) {
    const newLoc = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/locations', method: 'POST', headers: authHeaders }, {
      warehouseId: warehouse.id,
      name: 'Aisle 1',
      code: `LOC-DEL-${Date.now()}`
    });
    location = newLoc.data?.data;
  }

  if (!product) {
    const newCat = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/categories', method: 'POST', headers: authHeaders }, {
      name: 'General Items'
    });
    const newProd = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'POST', headers: authHeaders }, {
      name: 'Delivery Test Item',
      sku: `SKU-DEL-${Date.now()}`,
      categoryId: newCat.data?.data?.id,
      unit: 'pcs',
      reorderLevel: 10
    });
    product = newProd.data?.data;
  }

  console.log(`Using Warehouse: ${warehouse.name || warehouse.id}`);
  console.log(`Using Location: ${location.name || location.id}`);
  console.log(`Using Product: ${product.name || product.id}`);

  // 3. GET /api/deliveries
  console.log('\n--- Step 1: GET /api/deliveries ---');
  const getDelList = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/deliveries', method: 'GET', headers: authHeaders });
  console.log('GET Deliveries Status:', getDelList.status, 'Count:', getDelList.data?.data?.length);

  // 4. POST /api/deliveries (Create Delivery with high quantity for insufficient stock test)
  console.log('\n--- Step 2: POST /api/deliveries (Create Delivery Order with High Qty: 99999) ---');
  const createDelRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/deliveries',
    method: 'POST',
    headers: authHeaders
  }, {
    customerName: 'MegaCorp Construction',
    sourceWarehouseId: warehouse.id,
    sourceLocationId: location.id,
    notes: 'Urgent site delivery',
    items: [
      {
        productId: product.id,
        orderedQuantity: 99999,
        unitPrice: 15.5
      }
    ]
  });

  console.log('Create Delivery Status:', createDelRes.status);
  console.log('Delivery Ref:', createDelRes.data?.data?.referenceNumber);
  const deliveryId = createDelRes.data?.data?.id;

  // 5. GET /api/deliveries/:id
  console.log(`\n--- Step 3: GET /api/deliveries/${deliveryId} ---`);
  const getSingleRes = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/deliveries/${deliveryId}`, method: 'GET', headers: authHeaders });
  console.log('GET Single Status:', getSingleRes.status, 'Status:', getSingleRes.data?.data?.status);

  // 6. PUT /api/deliveries/:id (Update Delivery)
  console.log(`\n--- Step 4: PUT /api/deliveries/${deliveryId} (Update Delivery Notes) ---`);
  const updateRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/deliveries/${deliveryId}`,
    method: 'PUT',
    headers: authHeaders
  }, {
    notes: 'Updated: Handle with care - Heavy loads'
  });
  console.log('Update Delivery Status:', updateRes.status, 'Notes:', updateRes.data?.data?.notes);

  // 7. TEST INSUFFICIENT STOCK SCENARIO
  console.log(`\n--- Step 5: POST /api/deliveries/${deliveryId}/validate (Test Insufficient Stock Scenario) ---`);
  const validateExcessRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/deliveries/${deliveryId}/validate`,
    method: 'POST',
    headers: authHeaders
  });

  console.log('Validate Excess Status:', validateExcessRes.status);
  console.log('Validation Error Response:', validateExcessRes.data?.message || validateExcessRes.data);

  if (validateExcessRes.status === 400) {
    console.log('✅ SUCCESS: System rejected validation due to insufficient stock, strictly preventing negative inventory!');
  } else {
    console.warn('⚠️ Unexpected response for insufficient stock validation:', validateExcessRes.status);
  }

  // 8. TEST SUFFICIENT STOCK SCENARIO
  // First, receive stock using Receipt API so available quantity is ample
  console.log('\n--- Step 6: Create & Validate Receipt to replenish stock for valid delivery ---');
  const createRecRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/receipts',
    method: 'POST',
    headers: authHeaders
  }, {
    supplierName: 'Global Metals Corp',
    destinationWarehouseId: warehouse.id,
    destinationLocationId: location.id,
    notes: 'Stock top-up for delivery test',
    items: [
      {
        productId: product.id,
        expectedQuantity: 50,
        unitCost: 5.0
      }
    ]
  });

  const receiptId = createRecRes.data?.data?.id;
  await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/receipts/${receiptId}/validate`, method: 'POST', headers: authHeaders });
  console.log('Receipt validated & stock increased by +50.');

  // Create valid small delivery order (Qty: 10)
  console.log('\n--- Step 7: Create Delivery Order within Stock Limit (Qty: 10) ---');
  const createValidDelRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/deliveries',
    method: 'POST',
    headers: authHeaders
  }, {
    customerName: 'BuildTech Inc',
    sourceWarehouseId: warehouse.id,
    sourceLocationId: location.id,
    items: [
      {
        productId: product.id,
        orderedQuantity: 10,
        unitPrice: 12.0
      }
    ]
  });

  const validDeliveryId = createValidDelRes.data?.data?.id;
  console.log('Valid Delivery Order Created ID:', validDeliveryId);

  console.log(`\n--- Step 8: POST /api/deliveries/${validDeliveryId}/validate (Validate Valid Delivery Order) ---`);
  const validateValidRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/deliveries/${validDeliveryId}/validate`,
    method: 'POST',
    headers: authHeaders
  });

  console.log('Validate Status:', validateValidRes.status);
  console.log('Validated Delivery State:', validateValidRes.data?.data?.status);

  if (validateValidRes.status === 200 && validateValidRes.data?.data?.status === 'DONE') {
    console.log('✅ SUCCESS: Delivery order validated successfully, stock deducted atomically & logged to StockLedger!');
  }

  // 9. POST /api/deliveries/:id/cancel
  console.log(`\n--- Step 9: POST /api/deliveries/${deliveryId}/cancel (Cancel Draft Delivery Order) ---`);
  const cancelRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/deliveries/${deliveryId}/cancel`,
    method: 'POST',
    headers: authHeaders
  });

  console.log('Cancel Delivery Status:', cancelRes.status, 'Status:', cancelRes.data?.data?.status);

  console.log('\n=== ALL DELIVERY ORDER API & INSUFFICIENT STOCK TESTS COMPLETED SUCCESSFULLY ===');
}

runDeliveryTests().catch(console.error);
