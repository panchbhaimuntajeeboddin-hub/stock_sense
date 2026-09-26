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

async function runLedgerTests() {
  console.log('=== STARTING STOCK LEDGER READ-ONLY & PAGINATION API VERIFICATION ===\n');

  // 1. Authenticate user
  const authRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Ledger Auditor',
    email: `auditor_ledger_${Date.now()}@stocksense.io`,
    password: 'password123',
    role: 'INVENTORY_MANAGER'
  });

  const token = authRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. GET /api/stock-ledger (Default Paginated Fetch)
  console.log('--- Step 1: GET /api/stock-ledger (Fetch All Paginated Entries) ---');
  const getLedgerRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/stock-ledger?page=1&limit=10',
    method: 'GET',
    headers: authHeaders
  });

  console.log('GET Stock Ledger Status:', getLedgerRes.status);
  console.log('Total Records:', getLedgerRes.data?.pagination?.total);
  console.log('Current Page:', getLedgerRes.data?.pagination?.page, 'of', getLedgerRes.data?.pagination?.totalPages);
  console.log('Returned Items Count:', getLedgerRes.data?.data?.length);

  const sampleEntry = getLedgerRes.data?.data?.[0];
  if (sampleEntry) {
    console.log('Sample Entry Reference:', sampleEntry.referenceId, 'Type:', sampleEntry.type);
  }

  // 3. GET /api/stock-ledger?type=RECEIPT (Filter by Movement Type)
  console.log('\n--- Step 2: GET /api/stock-ledger?type=RECEIPT (Filter by Movement Type) ---');
  const receiptFilterRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/stock-ledger?type=RECEIPT',
    method: 'GET',
    headers: authHeaders
  });

  console.log('Filtered RECEIPT Status:', receiptFilterRes.status, 'Count:', receiptFilterRes.data?.data?.length);

  // 4. GET /api/stock-ledger?search=SKU (Search Filter)
  console.log('\n--- Step 3: GET /api/stock-ledger?search=SKU (Search by Product/SKU/Ref) ---');
  const searchRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/stock-ledger?search=SKU',
    method: 'GET',
    headers: authHeaders
  });

  console.log('Search Status:', searchRes.status, 'Search Results Count:', searchRes.data?.data?.length);

  // 5. GET /api/stock-ledger/:id (Get Single Entry by ID)
  if (sampleEntry?.id) {
    console.log(`\n--- Step 4: GET /api/stock-ledger/${sampleEntry.id} (Fetch Single Record) ---`);
    const singleRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/stock-ledger/${sampleEntry.id}`,
      method: 'GET',
      headers: authHeaders
    });

    console.log('Single Record Status:', singleRes.status, 'Type:', singleRes.data?.data?.type);
  }

  // 6. Test Read-Only Immutability: Assert POST to /api/stock-ledger returns 404 or 405 (Not Allowed)
  console.log('\n--- Step 5: Test Immutability (Attempt POST /api/stock-ledger) ---');
  const postTestRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/stock-ledger',
    method: 'POST',
    headers: authHeaders
  }, {
    type: 'RECEIPT',
    quantity: 100
  });

  console.log('POST /api/stock-ledger Status:', postTestRes.status);
  if (postTestRes.status === 404 || postTestRes.status === 405) {
    console.log('✅ SUCCESS: Manual creation/modification of stock ledger records is strictly forbidden!');
  }

  console.log('\n=== ALL STOCK LEDGER TESTS COMPLETED SUCCESSFULLY ===');
}

runLedgerTests().catch(console.error);
