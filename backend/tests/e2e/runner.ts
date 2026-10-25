/**
 * MASTER E2E TEST RUNNER FOR MILESTONE 12
 * 
 * Orchestration sequence:
 * 1. Run Pre-Test Safety Audit against GYM360 (must be 696 docs, 69 baseline docs 100% canonically identical).
 * 2. Run Tier A (Read-Only suite against live GYM360 server).
 * 3. Run Tier B (Isolated Mutation suite against GYM360_TEST with hard safety guards).
 * 4. Run Post-Test Safety Audit against GYM360 (must remain 696 docs, 69 baseline docs 100% canonically identical).
 */

import { runTierATests } from './readOnlyRealDb.test';
import { runTierBTests } from './mutationIsolatedDb.test';
import { execSync } from 'child_process';

async function main() {
  console.log('=====================================================');
  console.log('   GYM360 — MILESTONE 12 MASTER INTEGRATION RUNNER   ');
  console.log('=====================================================\n');

  try {
    // STEP 1: PRE-TEST AUDIT AGAINST GYM360
    console.log('[Phase 1] Executing Pre-Test Safety Audit against GYM360...');
    const preAuditOutput = execSync(
      'python C:/Users/Shareef/.gemini/antigravity/scratch/audit/verify_seed_system.py',
      { encoding: 'utf-8' }
    );
    console.log(preAuditOutput);
    console.log('✓ Pre-Test Audit Passed: GYM360 is intact with 696 documents and canonical baseline preserved.\n');

    // STEP 2: TIER A EXECUTION (READ-ONLY)
    console.log('[Phase 2] Executing Tier A Read-Only Tests against GYM360...');
    const tierAResult = await runTierATests();
    if (tierAResult.failed > 0) {
      throw new Error(`Tier A had ${tierAResult.failed} failures.`);
    }

    // STEP 3: TIER B EXECUTION (MUTATION IN GYM360_TEST)
    console.log('[Phase 3] Executing Tier B Mutation Tests in GYM360_TEST...');
    const tierBResult = await runTierBTests();
    if (tierBResult.failed > 0) {
      throw new Error(`Tier B had ${tierBResult.failed} failures.`);
    }

    // STEP 4: POST-TEST AUDIT AGAINST GYM360
    console.log('[Phase 4] Executing Post-Test Safety Audit against GYM360...');
    const postAuditOutput = execSync(
      'python C:/Users/Shareef/.gemini/antigravity/scratch/audit/verify_seed_system.py',
      { encoding: 'utf-8' }
    );
    console.log(postAuditOutput);
    console.log('✓ Post-Test Audit Passed: GYM360 remained 100% unaltered with exactly 696 documents!\n');

    console.log('=====================================================');
    console.log('     MILESTONE 13: ALL SUITES PASSED SUCCESSFULLY    ');
    console.log(`     Tier A Passed: ${tierAResult.passed} / ${tierAResult.passed + tierAResult.failed}`);
    console.log(`     Tier B Passed: ${tierBResult.passed} / ${tierBResult.passed + tierBResult.failed}`);
    console.log('=====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL ERROR during Milestone 13 execution]:', err);
    process.exit(1);
  }
}

main();
