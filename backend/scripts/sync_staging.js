const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function syncStagingFromGYM360() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const dbProd = client.db('GYM360');
  const dbStaging = client.db('GYM360_STAGING');

  // Verify GYM360 baseline before read
  const prodCols = await dbProd.listCollections().toArray();
  let prodTotal = 0;
  for (const c of prodCols) {
    prodTotal += await dbProd.collection(c.name).countDocuments();
  }
  console.log('GYM360 baseline before copy:', prodCols.length, 'collections,', prodTotal, 'documents');

  // Sync each collection into GYM360_STAGING
  for (const c of prodCols) {
    const docs = await dbProd.collection(c.name).find().toArray();
    await dbStaging.collection(c.name).deleteMany({});
    if (docs.length > 0) {
      await dbStaging.collection(c.name).insertMany(docs);
    }
    const stagingCount = await dbStaging.collection(c.name).countDocuments();
    console.log('[Synced to GYM360_STAGING]', c.name.padEnd(25), stagingCount);
  }

  // Ensure trainer user account exists in GYM360_STAGING Users collection
  const hash = await bcrypt.hash('Gym360@Seed2026', 10);
  const trainerVikramDoc = await dbStaging.collection('trainers').findOne({ email: 'seed.trainer.vikram@gym360.com' });
  if (trainerVikramDoc) {
    await dbStaging.collection('Users').updateOne(
      { email: 'seed.trainer.vikram@gym360.com' },
      {
        $set: {
          firstName: 'Vikram',
          lastName: 'Seth',
          email: 'seed.trainer.vikram@gym360.com',
          phone: '9820000010',
          passwordHash: hash,
          role: 'trainer',
          status: 'active',
          trainerId: trainerVikramDoc._id,
          organizationId: trainerVikramDoc.organizationId
        }
      },
      { upsert: true }
    );
    console.log('Trainer Vikram user upserted into GYM360_STAGING Users.');
  }

  // Verify GYM360 remains untouched
  let prodTotalAfter = 0;
  for (const c of prodCols) {
    prodTotalAfter += await dbProd.collection(c.name).countDocuments();
  }
  console.log('GYM360 baseline after copy (MUST BE 696):', prodTotalAfter);

  const stagingMembers = await dbStaging.collection('members').countDocuments();
  console.log('GYM360_STAGING total members count:', stagingMembers);

  await client.close();
}
syncStagingFromGYM360().catch(console.error);
