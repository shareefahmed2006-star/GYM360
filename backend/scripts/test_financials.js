const http = require('http');

async function postJson(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...headers,
        },
      },
      (res) => {
        let d = '';
        res.on('data', (chunk) => (d += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d || '{}') }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers,
      },
      (res) => {
        let d = '';
        res.on('data', (chunk) => (d += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d || '{}') }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('1. Health check...');
  const health = await getJson('http://127.0.0.1:5001/api/health');
  console.log('Health:', health.body);

  console.log('2. Admin login (seed.admin.kothrud@gym360.com)...');
  const adminLogin = await postJson('http://127.0.0.1:5001/api/auth/login', {
    email: 'seed.admin.kothrud@gym360.com',
    password: 'Gym360@Seed2026',
  });
  console.log('Admin login status:', adminLogin.status, 'Role:', adminLogin.body?.data?.user?.role);
  const token = adminLogin.body?.data?.token;

  console.log('3. Expiring memberships endpoint...');
  const expiring = await getJson(
    'http://127.0.0.1:5001/api/memberships/expiring-soon?daysAhead=365',
    { Authorization: `Bearer ${token}` }
  );
  console.log('Expiring memberships returned:', expiring.body?.data?.expiringMemberships?.length ?? expiring.body?.expiringMemberships?.length);
  const expiringList = expiring.body?.data?.expiringMemberships || expiring.body?.expiringMemberships || [];
  if (expiringList.length > 0) {
    const sampleExpiring = expiringList[0];
    console.log('Sample expiring membership:');
    console.log({
      _id: sampleExpiring._id,
      memberName: sampleExpiring.memberName,
      planName: sampleExpiring.planName,
      endDate: sampleExpiring.endDate,
      daysRemaining: sampleExpiring.daysRemaining,
      planPrice: sampleExpiring.planPrice,
    });
  }

  console.log('4. Payments list endpoint...');
  const payments = await getJson('http://127.0.0.1:5001/api/payments', {
    Authorization: `Bearer ${token}`,
  });
  const paymentList = payments.body?.data?.payments || payments.body?.payments || [];
  console.log('Payments returned:', paymentList.length);
  if (paymentList.length > 0) {
    const p = paymentList[0];
    console.log('Sample payment:');
    console.log({
      _id: p._id,
      amount: p.amount,
      transactionReference: p.transactionReference,
      paymentMethod: p.paymentMethod,
      status: p.status,
      paymentDate: p.paymentDate,
    });
  }

  console.log('5. Member login (seed.user.seed.member.1@gym360.com)...');
  const memberLogin = await postJson('http://127.0.0.1:5001/api/auth/login', {
    email: 'seed.user.seed.member.1@gym360.com',
    password: 'Gym360@Seed2026',
  });
  console.log('Member login status:', memberLogin.status, 'MemberId:', memberLogin.body?.data?.user?.memberId);
  const memberToken = memberLogin.body?.data?.token;

  console.log('6. Member expiring memberships check...');
  const memberExpiring = await getJson(
    'http://127.0.0.1:5001/api/memberships/expiring-soon?daysAhead=365',
    { Authorization: `Bearer ${memberToken}` }
  );
  const memberExpList = memberExpiring.body?.data?.expiringMemberships || memberExpiring.body?.expiringMemberships || [];
  console.log('Member expiring count:', memberExpList.length);
  if (memberExpList.length > 0) {
    console.log('Member membership:', memberExpList[0]);

    console.log('7. Testing 1-Click Renewal for Member membership...');
    const targetMembershipId = memberExpList[0]._id;
    const renewResult = await postJson(
      `http://127.0.0.1:5001/api/memberships/${targetMembershipId}/renew`,
      { paymentMethod: 'upi' },
      { Authorization: `Bearer ${memberToken}` }
    );
    console.log('Renew Status:', renewResult.status);
    const renewData = renewResult.body?.data || renewResult.body;
    console.log('Renew Result:', {
      membershipId: renewData?.membership?._id,
      newEndDate: renewData?.membership?.endDate,
      invoiceNumber: renewData?.payment?.invoiceNumber,
      amount: renewData?.payment?.amount,
      paymentStatus: renewData?.payment?.status,
    });
  }
}

run().catch((err) => console.error('Error running test:', err));
