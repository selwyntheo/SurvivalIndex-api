#!/usr/bin/env node
// Evaluate all projects with AI Judge, then bootstrap SFI-v3 scores.

import prisma from '../config/database.js';
import aiJudgeService from '../services/aiJudgeService.js';

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true, category: true },
  });

  console.log(`Found ${projects.length} projects to evaluate.\n`);

  let success = 0;
  let failed = 0;

  for (const p of projects) {
    try {
      const result = await aiJudgeService.evaluateAndStoreProject(p.id);
      const s = result.aiRating;
      console.log(
        `  ✅ ${p.name.padEnd(25)} ${p.category.padEnd(20)} ` +
        `score=${s.survivalScore.toFixed(2)}  tier=${s.tier}  ` +
        `[IC=${s.insightCompression} SE=${s.substrateEfficiency} BU=${s.broadUtility} ` +
        `AW=${s.awareness} AF=${s.agentFriction} HC=${s.humanCoefficient} ACES=${s.acesScore ?? '-'}]`
      );
      success++;
    } catch (err) {
      console.error(`  ❌ ${p.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
