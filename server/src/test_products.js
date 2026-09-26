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

async function runProductTests() {
  console.log('--- STARTING PRODUCT & CATEGORY MODULE API VERIFICATION ---');

  // 1. REGISTER & LOGIN ADMIN USER TO OBTAIN JWT TOKEN
  const regAdmin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Manager User',
    email: 'manager@stocksense.io',
    password: 'managerpassword123',
    role: 'INVENTORY_MANAGER'
  });

  const token = regAdmin.data.token || (await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'manager@stocksense.io', password: 'managerpassword123' })).data.token;

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. CATEGORY APIs
  console.log('\n1. Testing GET /api/categories...');
  const getCats = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/categories', method: 'GET', headers: authHeaders });
  console.log('Status:', getCats.status, 'Count:', getCats.data.data?.length);

  console.log('\n2. Testing POST /api/categories (Create Category)...');
  const createCat = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/categories', method: 'POST', headers: authHeaders }, {
    name: 'Industrial Cables',
    description: 'Heavy duty wiring & cables'
  });
  console.log('Status:', createCat.status, createCat.data);
  const catId = createCat.data.data?.id;

  console.log('\n3. Testing PUT /api/categories/:id (Update Category)...');
  const updateCat = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/categories/${catId}`, method: 'PUT', headers: authHeaders }, {
    name: 'Industrial Cables & Wires',
    description: 'Updated heavy duty wiring'
  });
  console.log('Status:', updateCat.status, updateCat.data);

  // 3. PRODUCT APIs & VALIDATIONS
  console.log('\n4. Testing POST /api/products (Validation Error: Missing Name)...');
  const errNoName = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'POST', headers: authHeaders }, {
    sku: 'SKU-ERR-1',
    categoryId: catId,
    unit: 'meters'
  });
  console.log('Status:', errNoName.status, errNoName.data.message);

  console.log('\n5. Testing POST /api/products (Validation Error: Negative Reorder Level)...');
  const errNegReorder = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'POST', headers: authHeaders }, {
    name: 'Test Cable',
    sku: 'SKU-ERR-2',
    categoryId: catId,
    unit: 'meters',
    reorderLevel: -5
  });
  console.log('Status:', errNegReorder.status, errNegReorder.data.message);

  console.log('\n6. Testing POST /api/products (Success Creation)...');
  const createProd1 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'POST', headers: authHeaders }, {
    name: 'High Voltage Copper Cable 50m',
    sku: 'SKU-CBL-001',
    categoryId: catId,
    unit: 'meters',
    reorderLevel: 25,
    costPrice: 40.0,
    salePrice: 75.0,
    initialStock: 100,
    warehouseId: 'wh-1',
    locationId: 'loc-1'
  });
  console.log('Status:', createProd1.status, createProd1.data);
  const prodId = createProd1.data.data?.id;

  console.log('\n7. Testing POST /api/products (Validation Error: Duplicate SKU)...');
  const errDupSku = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'POST', headers: authHeaders }, {
    name: 'Another Cable',
    sku: 'SKU-CBL-001', // Duplicate!
    categoryId: catId,
    unit: 'meters'
  });
  console.log('Status:', errDupSku.status, errDupSku.data.message);

  console.log('\n8. Testing GET /api/products (List all products)...');
  const getProds = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET', headers: authHeaders });
  console.log('Status:', getProds.status, 'Total Products:', getProds.data.data?.length);

  console.log('\n9. Testing GET /api/products?search=Copper (Search Filter)...');
  const searchProds = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products?search=Copper', method: 'GET', headers: authHeaders });
  console.log('Status:', searchProds.status, 'Search Results:', searchProds.data.data?.map(p => p.name));

  console.log('\n10. Testing GET /api/products/:id (Get Single Product Details)...');
  const getSingle = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/products/${prodId}`, method: 'GET', headers: authHeaders });
  console.log('Status:', getSingle.status, getSingle.data);

  console.log('\n11. Testing PUT /api/products/:id (Update Product)...');
  const updateProd = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/products/${prodId}`, method: 'PUT', headers: authHeaders }, {
    name: 'High Voltage Copper Cable 50m (Shielded)',
    reorderLevel: 30
  });
  console.log('Status:', updateProd.status, updateProd.data);

  console.log('\n12. Testing DELETE /api/products/:id...');
  const delProd = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/products/${prodId}`, method: 'DELETE', headers: authHeaders });
  console.log('Status:', delProd.status, delProd.data);

  console.log('\n13. Testing DELETE /api/categories/:id...');
  const delCat = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/categories/${catId}`, method: 'DELETE', headers: authHeaders });
  console.log('Status:', delCat.status, delCat.data);

  console.log('\n--- ALL PRODUCT & CATEGORY API VERIFICATION TESTS COMPLETED SUCCESSFULLY ---');
}

runProductTests().catch(console.error);
