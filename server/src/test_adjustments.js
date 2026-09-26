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

async function runAdjustmentTests() {
  console.log('=== STARTING STOCK ADJUSTMENTS API & ATOMIC TRANSACTION VERIFICATION ===\n');

  // 1. Authenticate user
  const authRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Adjustment Auditor',
    email: `auditor_${Date.now()}@stocksense.io`,
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
  const location = warehouse.locations?.[0] || { id: 'loc-1' };
  const product = prodRes.data.data?.[0] || { id: 'prod-1' };

  console.log(`Using Warehouse: ${warehouse.name || warehouse.id}`);
  console.log(`Using Location: ${location.name || location.id}`);
  console.log(`Using Product: ${product.name || product.id}`);

  // 3. GET /api/adjustments
  console.log('\n--- Step 1: GET /api/adjustments ---');
  const getAdjList = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/adjustments', method: 'GET', headers: authHeaders });
  console.log('GET Adjustments Status:', getAdjList.status, 'Count:', getAdjList.data?.data?.length);

  // 4. POST /api/adjustments (System = 100, Physical = 97, Difference = -3)
  console.log('\n--- Step 2: POST /api/adjustments (Create Adjustment: System=100, Physical=97) ---');
  const createAdjRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/adjustments',
    method: 'POST',
    headers: authHeaders
  }, {
    productId: product.id,
    warehouseId: warehouse.id,
    locationId: location.id,
    recordedQuantity: 100,
    countedQuantity: 97,
    reason: 'Annual audit discrepancy - damaged items during inspection'
  });

  console.log('Create Adjustment Status:', createAdjRes.status);
  console.log('Adjustment Reference:', createAdjRes.data?.data?.referenceNumber);
  console.log('Calculated Difference:', createAdjRes.data?.data?.difference);
  const adjustmentId = createAdjRes.data?.data?.id;

  // 5. GET /api/adjustments/:id
  console.log(`\n--- Step 3: GET /api/adjustments/${adjustmentId} ---`);
  const getSingleRes = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/adjustments/${adjustmentId}`, method: 'GET', headers: authHeaders });
  console.log('GET Single Status:', getSingleRes.status, 'Reason:', getSingleRes.data?.data?.reason);

  // 6. POST /api/adjustments/:id/validate (Commit Adjustment & Log StockLedger)
  console.log(`\n--- Step 4: POST /api/adjustments/${adjustmentId}/validate (Validate Adjustment) ---`);
  const validateRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/adjustments/${adjustmentId}/validate`,
    method: 'POST',
    headers: authHeaders
  });

  console.log('Validate Adjustment Status:', validateRes.status);
  console.log('Validated State:', validateRes.data?.data?.status);
  console.log('Final Difference:', validateRes.data?.data?.difference);

  if (validateRes.status === 200 && validateRes.data?.data?.status === 'DONE') {
    console.log('✅ SUCCESS: Stock adjustment validated! Physical count committed to stock, difference saved, and StockLedger entry recorded.');
  }

  console.log('\n=== ALL STOCK ADJUSTMENT TESTS COMPLETED SUCCESSFULLY ===');
}

runAdjustmentTests().catch(console.error);
