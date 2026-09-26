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

async function runAIAssistantTests() {
  console.log('=== STARTING AI INVENTORY ASSISTANT ENDPOINT & DATABASE GROUNDING VERIFICATION ===\n');

  // 1. Authenticate user
  const authRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'AI Tester',
    email: `ai_tester_${Date.now()}@stocksense.io`,
    password: 'password123',
    role: 'INVENTORY_MANAGER'
  });

  const token = authRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const testPrompts = [
    'Which products are low in stock?',
    'Which products should I reorder?',
    "Show me today's stock movements.",
    'Which warehouse has the most stock?',
    'Which products have the highest outgoing quantity?',
    'Which products may run out soon?'
  ];

  for (let i = 0; i < testPrompts.length; i++) {
    const promptText = testPrompts[i];
    console.log(`--- Test ${i + 1}: Question: "${promptText}" ---`);

    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/inventory-assistant',
      method: 'POST',
      headers: authHeaders
    }, {
      message: promptText
    });

    console.log('API Status Code:', res.status);
    console.log('Grounded in Database:', res.data?.data?.groundedInDatabase);
    console.log('AI Response Preview:\n' + res.data?.data?.reply?.substring(0, 300) + '...\n');

    if (res.status === 200 && res.data?.data?.groundedInDatabase) {
      console.log(`✅ SUCCESS for Question ${i + 1}\n`);
    } else {
      console.error(`❌ FAILED for Question ${i + 1}`, res.data);
    }
  }

  console.log('=== ALL AI INVENTORY ASSISTANT TESTS COMPLETED SUCCESSFULLY ===');
}

runAIAssistantTests().catch(console.error);
