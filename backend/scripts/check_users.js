const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function check() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('GYM360_STAGING');
  const users = await db.collection('Users').find({}).toArray();
  console.log(`Found ${users.length} users in GYM360_STAGING:`);
  for (const u of users) {
    const match1 = await bcrypt.compare('Gym360@Seed2026', u.passwordHash);
    const match2 = await bcrypt.compare('Password123!', u.passwordHash);
    console.log(`- ${u.email} (${u.role}): Gym360@Seed2026=${match1}, Password123!=${match2}`);
  }
  await client.close();
}
check().catch(console.error);
