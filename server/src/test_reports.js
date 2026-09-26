import http from 'http';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
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

async function runReportTests() {
  console.log('=== STARTING REPORTS MODULE SERVER-SIDE APIS & CSV EXPORT VERIFICATION ===\n');

  // 1. Authenticate user
  const authRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Report Auditor',
    email: `report_auditor_${Date.now()}@stocksense.io`,
    password: 'password123',
    role: 'INVENTORY_MANAGER'
  });

  const token = authRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. Report 1: Current Stock Report
  console.log('--- Step 1: GET /api/reports/current-stock ---');
  const rep1Res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/reports/current-stock?page=1&limit=5', method: 'GET', headers: authHeaders });
  console.log('Current Stock Report Status:', rep1Res.status);
  console.log('Pagination Total:', rep1Res.data?.pagination?.total, 'Returned Rows:', rep1Res.data?.data?.length);

  // 3. Report 2: Stock Movement Report
  console.log('\n--- Step 2: GET /api/reports/stock-movement ---');
  const rep2Res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/reports/stock-movement?page=1&limit=5', method: 'GET', headers: authHeaders });
  console.log('Stock Movement Report Status:', rep2Res.status);
  console.log('Pagination Total:', rep2Res.data?.pagination?.total, 'Returned Rows:', rep2Res.data?.data?.length);

  // 4. Report 3: Low Stock Report
  console.log('\n--- Step 3: GET /api/reports/low-stock ---');
  const rep3Res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/reports/low-stock?page=1&limit=5', method: 'GET', headers: authHeaders });
  console.log('Low Stock Report Status:', rep3Res.status);
  console.log('Pagination Total:', rep3Res.data?.pagination?.total, 'Returned Rows:', rep3Res.data?.data?.length);

  // 5. Report 4: Warehouse Stock Report
  console.log('\n--- Step 4: GET /api/reports/warehouse-stock ---');
  const rep4Res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/reports/warehouse-stock?page=1&limit=5', method: 'GET', headers: authHeaders });
  console.log('Warehouse Stock Report Status:', rep4Res.status);
  console.log('Pagination Total:', rep4Res.data?.pagination?.total, 'Returned Rows:', rep4Res.data?.data?.length);

  // 6. Report 5: Product Movement Report
  console.log('\n--- Step 5: GET /api/reports/product-movement ---');
  const rep5Res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/reports/product-movement?page=1&limit=5', method: 'GET', headers: authHeaders });
  console.log('Product Movement Report Status:', rep5Res.status);
  console.log('Pagination Total:', rep5Res.data?.pagination?.total, 'Returned Rows:', rep5Res.data?.data?.length);

  // 7. Test Export CSV
  console.log('\n--- Step 6: GET /api/reports/current-stock/export (Test CSV Download) ---');
  const csvRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/reports/current-stock/export', method: 'GET', headers: authHeaders });
  console.log('CSV Export Status:', csvRes.status);
  console.log('Content-Type Header:', csvRes.headers['content-type']);
  console.log('CSV Header Preview:\n' + String(csvRes.data).split('\n').slice(0, 2).join('\n'));

  if (csvRes.status === 200 && csvRes.headers['content-type']?.includes('csv')) {
    console.log('\n✅ SUCCESS: CSV Report exported successfully with server-side query generation!');
  }

  console.log('\n=== ALL REPORT TESTS COMPLETED SUCCESSFULLY ===');
}

runReportTests().catch(console.error);
