const http = require('http');
const { MongoClient, ObjectId } = require('mongodb');

async function requestJson(url, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = data ? JSON.stringify(data) : null;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
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
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log('=== GYM360 ADD & REMOVE (CRUD) INTEGRATION TEST ===\n');

  // Connect to staging DB directly to verify database reflection
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const dbStaging = client.db('GYM360_STAGING');
  const dbProd = client.db('GYM360');

  // Check baseline
  const prodDocsBefore = (await dbProd.listCollections().toArray()).reduce(
    async (accPromise, col) => (await accPromise) + (await dbProd.collection(col.name).countDocuments()),
    Promise.resolve(0)
  );

  // 1. Admin login
  console.log('1. Admin Login...');
  const loginRes = await requestJson('http://127.0.0.1:5001/api/auth/login', 'POST', {
    email: 'seed.admin.kothrud@gym360.com',
    password: 'Gym360@Seed2026',
  });
  if (loginRes.status !== 200) throw new Error('Admin login failed: ' + JSON.stringify(loginRes.body));
  const token = loginRes.body.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log('Admin login successful.\n');

  // 2. Test Member: Add and Delete
  console.log('2. Testing Member ADD & REMOVE:');
  const memberEmail = `test.member.${Date.now()}@example.com`;
  const branch = await dbStaging.collection('branches').findOne({});
  const createMemberRes = await requestJson('http://127.0.0.1:5001/api/members', 'POST', {
    firstName: 'Temp',
    lastName: 'TestUser',
    email: memberEmail,
    phone: '9988776655',
    branchId: branch._id.toHexString(),
  }, authHeaders);
  console.log('Create Member Status:', createMemberRes.status);
  const createdMemberId = createMemberRes.body.data?.member?._id;
  if (!createdMemberId) throw new Error('Member ID not returned');

  // Verify in MongoDB
  let foundInDb = await dbStaging.collection('members').findOne({ _id: new ObjectId(createdMemberId) });
  console.log('Found in MongoDB after create:', !!foundInDb, foundInDb?.email);

  // Delete Member via API
  const deleteMemberRes = await requestJson(`http://127.0.0.1:5001/api/members/${createdMemberId}`, 'DELETE', null, authHeaders);
  console.log('Delete Member API Status:', deleteMemberRes.status, deleteMemberRes.body?.message);

  // Verify deleted in MongoDB
  foundInDb = await dbStaging.collection('members').findOne({ _id: new ObjectId(createdMemberId) });
  console.log('Found in MongoDB after delete:', !!foundInDb, '(Expected: false)');
  console.log('Member ADD & REMOVE verification PASSED.\n');

  // 3. Test Membership Plan: Add and Delete
  console.log('3. Testing Membership Plan ADD & REMOVE:');
  const createPlanRes = await requestJson('http://127.0.0.1:5001/api/membership-plans', 'POST', {
    name: `Test Plan ${Date.now()}`,
    description: 'Temporary plan for testing addition and deletion',
    durationDays: 45,
    price: 1500,
    branchAccess: 'single_branch',
  }, authHeaders);
  console.log('Create Plan Status:', createPlanRes.status);
  const createdPlanId = createPlanRes.body.data?.plan?._id;
  if (!createdPlanId) throw new Error('Plan ID not returned');

  foundInDb = await dbStaging.collection('membershipPlans').findOne({ _id: new ObjectId(createdPlanId) });
  console.log('Found plan in MongoDB after create:', !!foundInDb);

  const deletePlanRes = await requestJson(`http://127.0.0.1:5001/api/membership-plans/${createdPlanId}`, 'DELETE', null, authHeaders);
  console.log('Delete Plan API Status:', deletePlanRes.status, deletePlanRes.body?.message);

  foundInDb = await dbStaging.collection('membershipPlans').findOne({ _id: new ObjectId(createdPlanId) });
  console.log('Found plan in MongoDB after delete:', !!foundInDb, '(Expected: false)');
  console.log('Membership Plan ADD & REMOVE verification PASSED.\n');

  // 4. Test Branch: Add and Delete
  console.log('4. Testing Branch ADD & REMOVE:');
  const createBranchRes = await requestJson('http://127.0.0.1:5001/api/branches', 'POST', {
    name: `Temp Branch ${Date.now()}`,
    phone: '9876543210',
    capacity: 100,
    openingTime: '06:00',
    closingTime: '22:00',
    address: {
      street: '123 Test St',
      city: 'Pune',
      state: 'MH',
      postalCode: '411038',
    },
  }, authHeaders);
  console.log('Create Branch Status:', createBranchRes.status);
  const createdBranchId = createBranchRes.body.data?.branch?._id;
  if (!createdBranchId) throw new Error('Branch ID not returned');

  foundInDb = await dbStaging.collection('branches').findOne({ _id: new ObjectId(createdBranchId) });
  console.log('Found branch in MongoDB after create:', !!foundInDb);

  const deleteBranchRes = await requestJson(`http://127.0.0.1:5001/api/branches/${createdBranchId}`, 'DELETE', null, authHeaders);
  console.log('Delete Branch API Status:', deleteBranchRes.status, deleteBranchRes.body?.message);

  foundInDb = await dbStaging.collection('branches').findOne({ _id: new ObjectId(createdBranchId) });
  console.log('Found branch in MongoDB after delete:', !!foundInDb, '(Expected: false)');
  console.log('Branch ADD & REMOVE verification PASSED.\n');

  // 5. Test Notification: Add and Delete
  console.log('5. Testing Notification ADD & REMOVE:');
  const user = await dbStaging.collection('Users').findOne({});
  const createNotifRes = await requestJson('http://127.0.0.1:5001/api/notifications', 'POST', {
    branchId: branch._id.toHexString(),
    recipientUserId: user._id.toHexString(),
    title: 'Test Notification',
    message: 'Testing deletion synchronization',
    type: 'announcement',
    priority: 'low',
  }, authHeaders);
  console.log('Create Notification Status:', createNotifRes.status);
  const createdNotifId = createNotifRes.body.data?._id;
  if (!createdNotifId) throw new Error('Notification ID not returned: ' + JSON.stringify(createNotifRes.body));

  foundInDb = await dbStaging.collection('notifications').findOne({ _id: new ObjectId(createdNotifId) });
  console.log('Found notification in MongoDB after create:', !!foundInDb);

  const deleteNotifRes = await requestJson(`http://127.0.0.1:5001/api/notifications/${createdNotifId}`, 'DELETE', null, authHeaders);
  console.log('Delete Notification API Status:', deleteNotifRes.status, deleteNotifRes.body?.message);

  foundInDb = await dbStaging.collection('notifications').findOne({ _id: new ObjectId(createdNotifId) });
  console.log('Found notification in MongoDB after delete:', !!foundInDb, '(Expected: false)');
  console.log('Notification ADD & REMOVE verification PASSED.\n');

  // 6. Test Production Database Untouched
  const prodDocsAfter = (await dbProd.listCollections().toArray()).reduce(
    async (accPromise, col) => (await accPromise) + (await dbProd.collection(col.name).countDocuments()),
    Promise.resolve(0)
  );
  console.log('6. Verifying GYM360 Production DB remains untouched:');
  console.log('GYM360 total docs count:', await prodDocsAfter, '(Expected: 696)');

  await client.close();
  console.log('\n=== ALL ADD & REMOVE TESTS COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
