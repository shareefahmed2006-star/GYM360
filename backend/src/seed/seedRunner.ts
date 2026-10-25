import { runSeeder } from './seedData';

async function main() {
  try {
    console.log('=== GYM360 SEED RUNNER START ===');
    const startTime = Date.now();
    const result = await runSeeder();
    const elapsed = Date.now() - startTime;
    console.log(`=== GYM360 SEED RUNNER FINISHED (${elapsed}ms) ===`);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('=== FATAL SEED ERROR ===');
    console.error(error);
    process.exit(1);
  }
}

main();
