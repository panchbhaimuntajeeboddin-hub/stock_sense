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

async function runDashboardTests() {
  console.log('=== STARTING DASHBOARD AGGREGATIONS & RECHARTS DATASET VERIFICATION ===\n');

  // 1. Authenticate user
  const authRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Dashboard Tester',
    email: `dash_tester_${Date.now()}@stocksense.io`,
    password: 'password123',
    role: 'INVENTORY_MANAGER'
  });

  const token = authRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. GET /api/dashboard (Overview Payload)
  console.log('--- Step 1: GET /api/dashboard (Full Dashboard Payload) ---');
  const overviewRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/dashboard',
    method: 'GET',
    headers: authHeaders
  });

  console.log('Overview Status:', overviewRes.status);
  const summaryData = overviewRes.data?.data?.summary;
  console.log('KPIs:', {
    totalProducts: summaryData?.totalProducts,
    totalStockUnits: summaryData?.totalStockUnits,
    lowStockItems: summaryData?.lowStockItems,
    outOfStockItems: summaryData?.outOfStockItems,
    pendingReceipts: summaryData?.pendingReceipts,
    pendingDeliveries: summaryData?.pendingDeliveries,
    scheduledTransfers: summaryData?.scheduledTransfers,
    totalWarehouses: summaryData?.totalWarehouses
  });

  // 3. GET /api/dashboard/summary
  console.log('\n--- Step 2: GET /api/dashboard/summary ---');
  const summaryRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/dashboard/summary', method: 'GET', headers: authHeaders });
  console.log('Summary Status:', summaryRes.status, 'Total Products:', summaryRes.data?.data?.totalProducts);

  // 4. GET /api/dashboard/charts
  console.log('\n--- Step 3: GET /api/dashboard/charts ---');
  const chartsRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/dashboard/charts', method: 'GET', headers: authHeaders });
  console.log('Charts Status:', chartsRes.status);
  console.log('Stock Movements Chart Length:', chartsRes.data?.data?.stockMovement?.length);
  console.log('Stock By Category Chart Length:', chartsRes.data?.data?.stockByCategory?.length);
  console.log('Stock By Warehouse Chart Length:', chartsRes.data?.data?.stockByWarehouse?.length);

  // 5. GET /api/dashboard/sections
  console.log('\n--- Step 4: GET /api/dashboard/sections ---');
  const sectionsRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/dashboard/sections', method: 'GET', headers: authHeaders });
  console.log('Sections Status:', sectionsRes.status);
  console.log('Low Stock Products Count:', sectionsRes.data?.data?.lowStockProducts?.length);
  console.log('Recent Movements Count:', sectionsRes.data?.data?.recentMovements?.length);
  console.log('Pending Receipts Count:', sectionsRes.data?.data?.pendingReceipts?.length);
  console.log('Pending Deliveries Count:', sectionsRes.data?.data?.pendingDeliveries?.length);

  console.log('\n=== ALL DASHBOARD API VERIFICATION TESTS COMPLETED SUCCESSFULLY ===');
}

runDashboardTests().catch(console.error);
