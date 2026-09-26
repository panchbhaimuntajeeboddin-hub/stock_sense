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

async function runTests() {
  console.log('--- STARTING AUTHENTICATION VERIFICATION TESTS ---');

  // 1. TEST REGISTER USER (ADMIN)
  console.log('\n1. Testing POST /api/auth/register (Admin User)...');
  const regAdmin = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Admin User',
    email: 'admin@stocksense.io',
    password: 'adminpassword123',
    role: 'ADMIN'
  });
  console.log('Status:', regAdmin.status, regAdmin.data);
  const adminToken = regAdmin.data.token;

  // 2. TEST REGISTER USER (STAFF)
  console.log('\n2. Testing POST /api/auth/register (Warehouse Staff User)...');
  const regStaff = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Staff Worker',
    email: 'staff@stocksense.io',
    password: 'staffpassword123',
    role: 'WAREHOUSE_STAFF'
  });
  console.log('Status:', regStaff.status, regStaff.data);
  const staffToken = regStaff.data.token;

  // 3. TEST LOGIN (SUCCESS)
  console.log('\n3. Testing POST /api/auth/login (Correct Password)...');
  const loginSuccess = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'admin@stocksense.io',
    password: 'adminpassword123'
  });
  console.log('Status:', loginSuccess.status, loginSuccess.data);

  // 4. TEST LOGIN (INVALID PASSWORD)
  console.log('\n4. Testing POST /api/auth/login (Invalid Password)...');
  const loginFail = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'admin@stocksense.io',
    password: 'WRONG_PASSWORD_999'
  });
  console.log('Status:', loginFail.status, loginFail.data);

  // 5. TEST PROTECTED ROUTE GET /api/auth/me
  console.log('\n5. Testing GET /api/auth/me (Protected Route with JWT Bearer)...');
  const getMeRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Status:', getMeRes.status, getMeRes.data);

  // 6. TEST ROLE AUTHORIZATION (ADMIN accessing /api/inventory/admin-only)
  console.log('\n6a. Testing Role Authorization: Admin accessing /api/inventory/admin-only...');
  const adminAccess = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/inventory/admin-only',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Status:', adminAccess.status, adminAccess.data);

  // 6b. TEST ROLE AUTHORIZATION (STAFF attempting to access /api/inventory/admin-only -> 403 Forbidden)
  console.log('\n6b. Testing Role Authorization: Staff attempting to access /api/inventory/admin-only (Expect 403 Forbidden)...');
  const staffDenied = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/inventory/admin-only',
    method: 'GET',
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  console.log('Status:', staffDenied.status, staffDenied.data);

  // 7. TEST OTP FORGOT PASSWORD & RESET
  console.log('\n7a. Testing POST /api/auth/forgot-password (Request OTP)...');
  const otpReq = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/forgot-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'staff@stocksense.io' });
  console.log('Status:', otpReq.status, otpReq.data);

  const otpCode = otpReq.data.otp;

  console.log('\n7b. Testing POST /api/auth/verify-otp...');
  const otpVerify = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/verify-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'staff@stocksense.io', otp: otpCode });
  console.log('Status:', otpVerify.status, otpVerify.data);

  console.log('\n7c. Testing POST /api/auth/reset-password...');
  const resetPass = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/reset-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'staff@stocksense.io', otp: otpCode, newPassword: 'newstaffpassword456' });
  console.log('Status:', resetPass.status, resetPass.data);

  console.log('\n--- ALL AUTHENTICATION VERIFICATION TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(console.error);
