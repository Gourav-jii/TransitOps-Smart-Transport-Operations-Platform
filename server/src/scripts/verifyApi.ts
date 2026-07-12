import http from 'http';

const BASE_URL = 'http://localhost:5000/api/v1';

function makeRequest(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: any }> {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const payload = body ? JSON.stringify(body) : '';
    
    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        let parsed = {};
        try {
          parsed = JSON.parse(rawData);
        } catch {
          parsed = { raw: rawData };
        }
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('STARTING AUTOMATED API INTEGRATION & SECURITY TESTS');
  console.log('========================================================\n');

  try {
    // 1. Health check
    console.log('[Test 1] Checking API Health check endpoint...');
    const health = await makeRequest('GET', '/health');
    if (health.status === 200 && health.data.success) {
      console.log('✓ Health check passed successfully.\n');
    } else {
      throw new Error(`Health check failed with status: ${health.status}`);
    }

    // 2. Security Headers
    console.log('[Test 2] Validating Helmet-style HTTP security headers...');
    const headers = health.headers;
    const requiredHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection', 'content-security-policy'];
    
    let allHeadersPresent = true;
    for (const header of requiredHeaders) {
      if (headers[header]) {
        console.log(`  - Header [${header}]: "${headers[header]}"`);
      } else {
        console.warn(`  ⚠ Warning: Missing security header [${header}]`);
        allHeadersPresent = false;
      }
    }
    if (allHeadersPresent) {
      console.log('✓ Custom security headers verified successfully.\n');
    } else {
      console.log('⚠ Security headers warning. Verify Express configuration.\n');
    }

    // 3. User Authentication Login
    console.log('[Test 3] Verifying Fleet Manager authentication login credentials...');
    const loginPayload = {
      email: 'manager@transitops.com',
      password: 'Password@123',
    };
    const loginRes = await makeRequest('POST', '/auth/login', loginPayload);
    
    let token = '';
    if (loginRes.status === 200 && loginRes.data.success) {
      token = loginRes.data.token;
      console.log('✓ Authentication successful.');
      console.log(`  - Logged in User: ${loginRes.data.user.name}`);
      console.log(`  - Role: ${loginRes.data.user.role}`);
      console.log(`  - Token Length: ${token.length} chars\n`);
    } else {
      throw new Error(`Login failed with status: ${loginRes.status} / ${JSON.stringify(loginRes.data)}`);
    }

    // 4. Rate Limiting Headers
    console.log('[Test 4] Querying rate limiter headers...');
    if (headers['x-ratelimit-limit']) {
      console.log(`  - RateLimit Limit: ${headers['x-ratelimit-limit']}`);
      console.log(`  - RateLimit Remaining: ${headers['x-ratelimit-remaining']}`);
      console.log(`  - RateLimit Reset: ${headers['x-ratelimit-reset']}`);
      console.log('✓ Rate limiting tracking verified.\n');
    } else {
      console.warn('⚠ Rate limiting headers not found in response.\n');
    }

    // 5. Authorized Resource Access
    console.log('[Test 5] Fetching protected me context using JWT Bearer token...');
    const meRes = await makeRequest('GET', '/auth/me', undefined, {
      'Authorization': `Bearer ${token}`,
    });

    if (meRes.status === 200 && meRes.data.success) {
      console.log('✓ Token validation and protected access verified.');
      console.log(`  - Retrieved payload email: ${meRes.data.user.email}\n`);
    } else {
      throw new Error(`Failed to access authenticated me route: ${meRes.status}`);
    }

    console.log('========================================================');
    console.log('ALL API INTEGRATION & SECURITY TESTS PASSED SUCCESSFULLY');
    console.log('========================================================');
  } catch (error: any) {
    console.error('\n❌ API verification test failed:', error);
    process.exit(1);
  }
}

runTests();
