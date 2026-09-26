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

async function runAlertTests() {
  console.log('=== STARTING LOW STOCK ALERTS API VERIFICATION ===\n');

  // 1. Authenticate user
  const authRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Alerts Tester',
    email: `alert_tester_${Date.now()}@stocksense.io`,
    password: 'password123',
    role: 'INVENTORY_MANAGER'
  });

  const token = authRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. GET /api/alerts/low-stock (All Active Stock Alerts)
  console.log('--- Step 1: GET /api/alerts/low-stock ---');
  const alertsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/alerts/low-stock',
    method: 'GET',
    headers: authHeaders
  });

  console.log('GET Alerts Status:', alertsRes.status);
  console.log('Total Alert Items:', alertsRes.data?.data?.length);
  console.log('Summary:', alertsRes.data?.summary);

  const sampleAlert = alertsRes.data?.data?.[0];
  if (sampleAlert) {
    console.log('Sample Alert Item:', {
      product: sampleAlert.productName,
      sku: sampleAlert.sku,
      currentStock: sampleAlert.currentStock,
      reorderLevel: sampleAlert.reorderLevel,
      warehouse: sampleAlert.warehouseName,
      location: sampleAlert.locationName,
      status: sampleAlert.status
    });
  }

  // 3. GET /api/alerts/low-stock?status=LOW_STOCK
  console.log('\n--- Step 2: GET /api/alerts/low-stock?status=LOW_STOCK ---');
  const lowOnlyRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/alerts/low-stock?status=LOW_STOCK',
    method: 'GET',
    headers: authHeaders
  });
  console.log('LOW_STOCK Only Count:', lowOnlyRes.data?.data?.length);

  // 4. GET /api/alerts/low-stock?status=OUT_OF_STOCK
  console.log('\n--- Step 3: GET /api/alerts/low-stock?status=OUT_OF_STOCK ---');
  const outOnlyRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/alerts/low-stock?status=OUT_OF_STOCK',
    method: 'GET',
    headers: authHeaders
  });
  console.log('OUT_OF_STOCK Only Count:', outOnlyRes.data?.data?.length);

  console.log('\n=== ALL LOW STOCK ALERT TESTS COMPLETED SUCCESSFULLY ===');
}

runAlertTests().catch(console.error);
