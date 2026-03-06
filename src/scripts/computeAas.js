#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import { computeRealAAS } from '../services/aasComputeService.js';
import prisma from '../config/database.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const categoriesArg = args.find(a => a.startsWith('--categories='));
const categories = categoriesArg ? categoriesArg.split('=')[1].split(',') : null;

console.log('=== AAS Real Computation ===');
console.log('This sends blind prompts (no tool names) to multiple Claude models');
console.log('and measures which tools they recommend unprompted.\n');

if (dryRun) console.log('DRY RUN — no data will be saved.\n');

try {
  // Clear old bootstrapped scores if not dry run
  if (!dryRun) {
    const deleted = await prisma.aasScore.deleteMany({});
    console.log(`Cleared ${deleted.count} old AAS scores.\n`);
  }

  const results = await computeRealAAS({ dryRun, categories });
  console.log(`\n✅ Done. ${results.length} tools scored.`);
} catch (err) {
  console.error('Computation failed:', err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
