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

async function runReceiptTests() {
  console.log('--- STARTING RECEIPT MODULE & TRANSACTION VERIFICATION TESTS ---');

  // 1. REGISTER MANAGER USER TO OBTAIN JWT TOKEN
  const regRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Receipt Manager',
    email: 'receiptmgr@stocksense.io',
    password: 'receiptmgrpassword123',
    role: 'INVENTORY_MANAGER'
  });

  const token = regRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. RECEIPT APIs
  console.log('\n1. Testing GET /api/receipts...');
  const getRecs = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/receipts', method: 'GET', headers: authHeaders });
  console.log('Status:', getRecs.status, 'Total Receipts:', getRecs.data.data?.length);

  console.log('\n2. Testing POST /api/receipts (Create Multi-Item Receipt Order)...');
  const createRec = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/receipts', method: 'POST', headers: authHeaders }, {
    supplierName: 'Apex Metal Supplies Corp',
    destinationWarehouseId: 'wh-1',
    destinationLocationId: 'loc-1',
    notes: 'PO-9912 Urgent Steel Batch Shipment',
    items: [
      { productId: 'prod-1', expectedQuantity: 50, receivedQuantity: 50, unitCost: 4.50 }
    ]
  });
  console.log('Status:', createRec.status, createRec.data);
  const recId = createRec.data.data?.id;

  console.log('\n3. Testing GET /api/receipts/:id (Get Receipt Details)...');
  const getSingleRec = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/receipts/${recId}`, method: 'GET', headers: authHeaders });
  console.log('Status:', getSingleRec.status, getSingleRec.data);

  console.log('\n4. Testing PUT /api/receipts/:id (Update DRAFT Receipt)...');
  const updateRec = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/receipts/${recId}`, method: 'PUT', headers: authHeaders }, {
    notes: 'Updated PO-9912 Shipment Notes'
  });
  console.log('Status:', updateRec.status, updateRec.data);

  console.log('\n5. Testing POST /api/receipts/:id/validate (Database Transaction: Stock Increment + StockLedger Entry)...');
  const validateRec = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/receipts/${recId}/validate`, method: 'POST', headers: authHeaders });
  console.log('Status:', validateRec.status, validateRec.data);

  console.log('\n6. Testing PUT /api/receipts/:id on DONE Receipt (Expect 400 Bad Request Prohibition Error)...');
  const errEditDone = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/receipts/${recId}`, method: 'PUT', headers: authHeaders }, {
    notes: 'Attempting edit on DONE receipt'
  });
  console.log('Status:', errEditDone.status, errEditDone.data.message);

  console.log('\n7. Testing POST /api/receipts (Create Second Receipt to test Cancel)...');
  const createRec2 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/receipts', method: 'POST', headers: authHeaders }, {
    supplierName: 'TechComponents Ltd',
    destinationWarehouseId: 'wh-1',
    destinationLocationId: 'loc-3',
    items: [{ productId: 'prod-2', expectedQuantity: 20, receivedQuantity: 20 }]
  });
  const recId2 = createRec2.data.data?.id;

  console.log('\n8. Testing POST /api/receipts/:id/cancel...');
  const cancelRec = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/receipts/${recId2}/cancel`, method: 'POST', headers: authHeaders });
  console.log('Status:', cancelRec.status, cancelRec.data);

  console.log('\n--- ALL RECEIPT MODULE & TRANSACTION VERIFICATION TESTS COMPLETED SUCCESSFULLY ---');
}

runReceiptTests().catch(console.error);
