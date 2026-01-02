const BASE = 'https://okapiafhportal-production.up.railway.app';

async function testImpersonation() {
  console.log('=== ADMIN IMPERSONATION TEST ===\n');

  // Step 1: Login as admin
  console.log('1. Logging in as admin...');
  const loginRes = await fetch(BASE + '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@okapicarenetwork.com',
      password: 'OkapiAdmin2024!'
    })
  });

  const cookies = loginRes.headers.get('set-cookie');
  console.log('   Status:', loginRes.status);
  console.log('   Cookie received:', cookies ? '✓' : '✗');

  if (loginRes.status !== 200) {
    console.log('   Login failed:', await loginRes.text());
    return;
  }

  const loginData = await loginRes.json();
  console.log('   Admin:', loginData.admin.email, '(' + loginData.admin.role + ')');
  console.log('   Can impersonate:', loginData.admin.canImpersonate);

  // Step 2: Check /me before impersonation
  console.log('\n2. Checking /api/admin/me (before impersonation)...');
  const meRes1 = await fetch(BASE + '/api/admin/me', {
    headers: { 'Cookie': cookies }
  });
  const me1 = await meRes1.json();
  console.log('   Status:', meRes1.status);
  console.log('   impersonatedFacility:', me1.impersonatedFacility || 'null');

  // Step 3: Start impersonation
  const FACILITY_ID = '9d4f6f1e-f15f-4812-9e56-f34c244d3fe5'; // Emerald City
  console.log('\n3. Starting impersonation of facility:', FACILITY_ID);
  const impersonateRes = await fetch(BASE + '/api/admin/impersonate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({ facilityId: FACILITY_ID })
  });

  console.log('   Status:', impersonateRes.status);
  const impData = await impersonateRes.json();
  console.log('   Response:', JSON.stringify(impData, null, 2));

  // Step 4: Check /me after impersonation
  console.log('\n4. Checking /api/admin/me (after impersonation)...');
  const meRes2 = await fetch(BASE + '/api/admin/me', {
    headers: { 'Cookie': cookies }
  });
  const me2 = await meRes2.json();
  console.log('   Status:', meRes2.status);
  console.log('   impersonatedFacility:', JSON.stringify(me2.impersonatedFacility));

  // Step 5: Access owner route while impersonating
  console.log('\n5. Accessing owner facility route while impersonating...');
  const facilityRes = await fetch(BASE + '/api/owners/facilities/' + FACILITY_ID + '/ehr/dashboard', {
    headers: { 'Cookie': cookies }
  });
  console.log('   Status:', facilityRes.status, facilityRes.status === 200 ? '✓' : '');
  if (facilityRes.status !== 200) {
    console.log('   Response:', await facilityRes.text());
  }

  // Step 6: Stop impersonation
  console.log('\n6. Stopping impersonation...');
  const stopRes = await fetch(BASE + '/api/admin/stop-impersonate', {
    method: 'POST',
    headers: { 'Cookie': cookies }
  });
  console.log('   Status:', stopRes.status);
  const stopData = await stopRes.json();
  console.log('   Response:', JSON.stringify(stopData));

  // Step 7: Verify stopped
  console.log('\n7. Verifying impersonation stopped...');
  const meRes3 = await fetch(BASE + '/api/admin/me', {
    headers: { 'Cookie': cookies }
  });
  const me3 = await meRes3.json();
  console.log('   impersonatedFacility:', me3.impersonatedFacility || 'null ✓');

  console.log('\n=== TEST COMPLETE ===');
}

testImpersonation().catch(console.error);
