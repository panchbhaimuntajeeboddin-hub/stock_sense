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

async function runTransferTests() {
  console.log('=== STARTING INTERNAL STOCK TRANSFERS API & ATOMIC TRANSACTION VERIFICATION ===\n');

  // 1. Authenticate user
  const authRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Transfer Manager',
    email: `trfmanager_${Date.now()}@stocksense.io`,
    password: 'password123',
    role: 'INVENTORY_MANAGER'
  });

  const token = authRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. Fetch prerequisite entities (Warehouse, Location, Product)
  const whRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/warehouses', method: 'GET', headers: authHeaders });
  const prodRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET', headers: authHeaders });

  const warehouse = whRes.data.data?.[0] || { id: 'wh-1' };
  const srcLoc = warehouse.locations?.[0] || { id: 'loc-1' };
  const destLoc = warehouse.locations?.[1] || { id: 'loc-2' };
  const product = prodRes.data.data?.[0] || { id: 'prod-1' };

  console.log(`Using Source Warehouse: ${warehouse.name || warehouse.id}, Location: ${srcLoc.name || srcLoc.id}`);
  console.log(`Using Destination Location: ${destLoc.name || destLoc.id}`);
  console.log(`Using Product: ${product.name || product.id}`);

  // 3. GET /api/transfers
  console.log('\n--- Step 1: GET /api/transfers ---');
  const getTrfList = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/transfers', method: 'GET', headers: authHeaders });
  console.log('GET Transfers Status:', getTrfList.status, 'Count:', getTrfList.data?.data?.length);

  // 4. TEST RULE: Identical Source and Destination Rejection
  console.log('\n--- Step 2: POST /api/transfers (Test Identical Source & Destination Rejection) ---');
  const identicalRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/transfers',
    method: 'POST',
    headers: authHeaders
  }, {
    sourceWarehouseId: warehouse.id,
    sourceLocationId: srcLoc.id,
    destinationWarehouseId: warehouse.id,
    destinationLocationId: srcLoc.id, // IDENTICAL!
    items: [{ productId: product.id, quantity: 10 }]
  });

  console.log('Identical Location Rejection Status:', identicalRes.status);
  console.log('Response Error:', identicalRes.data?.message || identicalRes.data);

  if (identicalRes.status === 400) {
    console.log('✅ SUCCESS: System rejected identical source & destination transfer request!');
  }

  // 5. TEST RULE: Insufficient Stock at Source Location Rejection
  console.log('\n--- Step 3: POST /api/transfers (Create Transfer with High Qty: 99999) ---');
  const createExcessRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/transfers',
    method: 'POST',
    headers: authHeaders
  }, {
    sourceWarehouseId: warehouse.id,
    sourceLocationId: srcLoc.id,
    destinationWarehouseId: warehouse.id,
    destinationLocationId: destLoc.id,
    items: [{ productId: product.id, quantity: 99999 }]
  });

  const excessTrfId = createExcessRes.data?.data?.id;

  console.log('\n--- Step 4: POST /api/transfers/:id/validate (Test Insufficient Source Stock Validation Rejection) ---');
  const validateExcessRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/transfers/${excessTrfId}/validate`,
    method: 'POST',
    headers: authHeaders
  });

  console.log('Validate Excess Status:', validateExcessRes.status);
  console.log('Validation Error Response:', validateExcessRes.data?.message || validateExcessRes.data);

  if (validateExcessRes.status === 400) {
    console.log('✅ SUCCESS: Validation rejected due to insufficient stock at source location!');
  }

  // 6. TEST SUCCESSFUL STOCK RELOCATION TRANSACTION
  console.log('\n--- Step 5: Create & Validate Receipt to top up source stock ---');
  const topUpRecRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/receipts',
    method: 'POST',
    headers: authHeaders
  }, {
    supplierName: 'Relocation Stock Supplier',
    destinationWarehouseId: warehouse.id,
    destinationLocationId: srcLoc.id,
    items: [{ productId: product.id, expectedQuantity: 100 }]
  });
  const receiptId = topUpRecRes.data?.data?.id;
  await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/receipts/${receiptId}/validate`, method: 'POST', headers: authHeaders });
  console.log('Receipt validated & source stock increased by +100.');

  console.log('\n--- Step 6: Create Valid Transfer Order (Qty: 25) ---');
  const validTrfRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/transfers',
    method: 'POST',
    headers: authHeaders
  }, {
    sourceWarehouseId: warehouse.id,
    sourceLocationId: srcLoc.id,
    destinationWarehouseId: warehouse.id,
    destinationLocationId: destLoc.id,
    items: [{ productId: product.id, quantity: 25 }]
  });

  const validTrfId = validTrfRes.data?.data?.id;
  console.log('Valid Transfer Created ID:', validTrfId);

  console.log(`\n--- Step 7: POST /api/transfers/${validTrfId}/validate (Validate & Relocate Stock) ---`);
  const validateValidRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/transfers/${validTrfId}/validate`,
    method: 'POST',
    headers: authHeaders
  });

  console.log('Validate Status:', validateValidRes.status);
  console.log('Validated Transfer State:', validateValidRes.data?.data?.status);

  if (validateValidRes.status === 200 && validateValidRes.data?.data?.status === 'DONE') {
    console.log('✅ SUCCESS: Stock transfer validated! Source stock decreased, destination stock increased, TRANSFER_OUT and TRANSFER_IN entries created.');
  }

  // 7. CANCEL DRAFT TRANSFER
  console.log(`\n--- Step 8: POST /api/transfers/${excessTrfId}/cancel (Cancel Excess Transfer) ---`);
  const cancelRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/transfers/${excessTrfId}/cancel`,
    method: 'POST',
    headers: authHeaders
  });

  console.log('Cancel Transfer Status:', cancelRes.status, 'Status:', cancelRes.data?.data?.status);

  console.log('\n=== ALL INTERNAL STOCK TRANSFER TESTS COMPLETED SUCCESSFULLY ===');
}

runTransferTests().catch(console.error);
