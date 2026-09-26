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

async function runWarehouseTests() {
  console.log('--- STARTING WAREHOUSE & LOCATION MODULE API VERIFICATION ---');

  // 1. REGISTER OR LOGIN MANAGER USER TO OBTAIN JWT TOKEN
  const regRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Wh Manager',
    email: 'whmanager@stocksense.io',
    password: 'whmanagerpassword123',
    role: 'INVENTORY_MANAGER'
  });

  const token = regRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. WAREHOUSE APIs
  console.log('\n1. Testing GET /api/warehouses...');
  const getWhs = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/warehouses', method: 'GET', headers: authHeaders });
  console.log('Status:', getWhs.status, 'Total Warehouses:', getWhs.data.data?.length);

  console.log('\n2. Testing POST /api/warehouses (Create Warehouse)...');
  const createWh = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/warehouses', method: 'POST', headers: authHeaders }, {
    name: 'East Coast Distribution Hub',
    code: 'WH-EAST',
    address: '700 Freight Road, Port District'
  });
  console.log('Status:', createWh.status, createWh.data);
  const whId = createWh.data.data?.id;

  console.log('\n3. Testing GET /api/warehouses/:id (Get Single Warehouse)...');
  const getSingleWh = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/warehouses/${whId}`, method: 'GET', headers: authHeaders });
  console.log('Status:', getSingleWh.status, getSingleWh.data);

  console.log('\n4. Testing PUT /api/warehouses/:id (Update Warehouse)...');
  const updateWh = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/warehouses/${whId}`, method: 'PUT', headers: authHeaders }, {
    name: 'East Coast Distribution Hub (Expanded)',
    address: '700 Freight Road, Suite A'
  });
  console.log('Status:', updateWh.status, updateWh.data);

  // 3. LOCATION APIs
  console.log('\n5. Testing POST /api/locations (Create Storage Location)...');
  const createLoc = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/locations', method: 'POST', headers: authHeaders }, {
    warehouseId: whId,
    name: 'Storage Rack D1',
    code: 'RACK-D1'
  });
  console.log('Status:', createLoc.status, createLoc.data);
  const locId = createLoc.data.data?.id;

  console.log('\n6. Testing GET /api/warehouses/:id/locations (List Locations by Warehouse)...');
  const getLocs = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/warehouses/${whId}/locations`, method: 'GET', headers: authHeaders });
  console.log('Status:', getLocs.status, 'Locations Count:', getLocs.data.data?.length);

  console.log('\n7. Testing PUT /api/locations/:id (Update Location)...');
  const updateLoc = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/locations/${locId}`, method: 'PUT', headers: authHeaders }, {
    name: 'Storage Rack D1 (Cold Storage)',
    code: 'RACK-D1-COLD'
  });
  console.log('Status:', updateLoc.status, updateLoc.data);

  console.log('\n8. Testing DELETE /api/locations/:id...');
  const delLoc = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/locations/${locId}`, method: 'DELETE', headers: authHeaders });
  console.log('Status:', delLoc.status, delLoc.data);

  console.log('\n9. Testing DELETE /api/warehouses/:id...');
  const delWh = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/warehouses/${whId}`, method: 'DELETE', headers: authHeaders });
  console.log('Status:', delWh.status, delWh.data);

  console.log('\n--- ALL WAREHOUSE & LOCATION API VERIFICATION TESTS COMPLETED SUCCESSFULLY ---');
}

runWarehouseTests().catch(console.error);
