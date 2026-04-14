// Direct test using fetch to call the backend API
// Tests if the login and permission flow is working

const http = require('http');

const BASE_URL = 'https://hammsapi.bluai.ai';

function makeRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 12000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  console.log('Testing USER LOGIN flow with permissions...\n');

  // 1. Test user login (will get temporary token)
  const loginRes = await makeRequest('POST', '/api/users/login', {
    email: 'subham@bluai.ai',
    password: 'Test@1234',  // user must update with real password
    company_code: 'HP-01'
  });

  console.log('Step 1 - Login response status:', loginRes.status);
  console.log('Login data:', JSON.stringify(loginRes.data, null, 2));

  if (loginRes.data?.requires_2fa) {
    console.log('\n✅ 2FA required. The test needs 2FA code to continue.');
    console.log('This confirms login is working. Enter your 2FA code to see permissions.');
  }
}

test().catch(console.error);
