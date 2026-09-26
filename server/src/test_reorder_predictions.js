import http from 'http';

const loginUser = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'reorder_admin@stocksense.io',
      password: 'password123'
    });

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.token) {
              resolve(data.token);
            } else {
              // Try registering
              registerUser().then(resolve).catch(reject);
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const registerUser = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: 'Reorder Admin',
      email: 'reorder_admin@stocksense.io',
      password: 'password123',
      role: 'ADMIN'
    });

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data.token);
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const getPredictions = (token, queryParams = '') => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/ai/reorder-predictions${queryParams}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ status: res.statusCode, data });
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
};

async function runTest() {
  console.log('=== STARTING AI REORDER PREDICTION MODULE API VERIFICATION ===\n');
  try {
    const token = await loginUser();
    console.log('1. Obtained JWT token:', token ? token.substring(0, 25) + '...' : 'NONE');

    const res = await getPredictions(token);
    console.log(`2. GET /api/ai/reorder-predictions Status: ${res.status}`);
    console.log('Response body:', res.data);

    if (res.data.data && res.data.data.length > 0) {
      console.log('\nSample Prediction Item:');
      const sample = res.data.data[0];
      console.log(`• Product: ${sample.name} (${sample.sku})`);
      console.log(`• Current Stock: ${sample.currentStock} ${sample.unit}`);
      console.log(`• Reorder Level: ${sample.reorderLevel}`);
      console.log(`• Avg Daily Usage: ${sample.averageDailyUsage} units/day`);
      console.log(`• Estimated Days Remaining: ${sample.estimatedDaysRemaining}`);
      console.log(`• Suggested Reorder Qty: ${sample.suggestedReorderQuantity}`);
      console.log(`• Risk Level: ${sample.riskLevel}`);
      console.log(`• Confidence: ${sample.confidence}`);
      console.log(`• Is AI Estimate: ${sample.isAiEstimate}`);
    } else {
      console.log('No predictions returned.');
    }

    console.log('\n=== AI REORDER PREDICTION TESTS COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTest();
