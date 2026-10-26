require('dotenv').config();
const { MongoClient } = require('mongodb');

const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/GYM360';
const atlasUri = process.env.MONGODB_URI;

if (!atlasUri) {
  console.error('Error: MONGODB_URI environment variable is required to migrate data.');
  process.exit(1);
}

async function migrate() {
  console.log('Connecting to Local MongoDB...');
  const localClient = new MongoClient(localUri);
  await localClient.connect();
  const localDb = localClient.db('GYM360');
  console.log('Connected to Local MongoDB.');

  console.log('Connecting to MongoDB Atlas Cloud...');
  const atlasClient = new MongoClient(atlasUri);
  await atlasClient.connect();
  const atlasDb = atlasClient.db('GYM360');
  console.log('Connected to MongoDB Atlas Cloud!');

  const collections = await localDb.listCollections().toArray();
  console.log(`Found ${collections.length} collections in local GYM360.`);

  let totalDocsCopied = 0;

  for (const collInfo of collections) {
    const collName = collInfo.name;
    if (collName.startsWith('system.')) continue;

    const localColl = localDb.collection(collName);
    const atlasColl = atlasDb.collection(collName);

    const docs = await localColl.find({}).toArray();
    console.log(`Migrating ${docs.length} documents from "${collName}"...`);

    if (docs.length > 0) {
      await atlasColl.deleteMany({});
      await atlasColl.insertMany(docs);
      totalDocsCopied += docs.length;
    }
  }

  console.log(`\n========================================`);
  console.log(`Successfully migrated ${totalDocsCopied} documents across ${collections.length} collections to MongoDB Atlas!`);
  console.log(`========================================`);

  await localClient.close();
  await atlasClient.close();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
