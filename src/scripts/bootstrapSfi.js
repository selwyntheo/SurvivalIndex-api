#!/usr/bin/env node

// SFI-v3 Bootstrap Script
// Maps existing AI Judge 7-lever scores to 5 SFI variables and computes initial scores.
// Run: node api/src/scripts/bootstrapSfi.js

import { PrismaClient } from '@prisma/client';
import { mapFromAIRating } from '../services/sfiMeasurementService.js';
import {
  calculateSurvival,
  deriveTiers,
  deriveTier,
  calculateConfidence,
  DEFAULT_WEIGHTS,
  FORMULA_VERSION,
} from '../services/sfiService.js';

const prisma = new PrismaClient();

async function bootstrap() {
  console.log('=== SFI-v3 Bootstrap ===');
  console.log(`Formula: ${FORMULA_VERSION}`);
  console.log(`Weights: w_s=${DEFAULT_WEIGHTS.w_s} w_u=${DEFAULT_WEIGHTS.w_u} w_h=${DEFAULT_WEIGHTS.w_h} w_a=${DEFAULT_WEIGHTS.w_a} w_f=${DEFAULT_WEIGHTS.w_f}`);
  console.log('');

  // 1. Query all projects with AI ratings
  const projects = await prisma.project.findMany({
    include: { aiRating: true },
  });

  console.log(`Found ${projects.length} projects total`);
  const withRatings = projects.filter(p => p.aiRating);
  console.log(`  ${withRatings.length} with AI ratings`);
  console.log(`  ${projects.length - withRatings.length} without ratings (will use defaults)`);
  console.log('');

  const now = new Date();
  const allScores = [];
  const records = [];

  // 2. Map each project
  for (const project of projects) {
    const categoryId = project.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    let vars;
    let source;
    if (project.aiRating) {
      vars = mapFromAIRating(project.aiRating);
      source = 'ai-rating-bootstrap';
    } else {
      vars = { savings: 5, usage: 5, human: 5, awarenessCost: 5, frictionCost: 5 };
      source = 'default';
    }

    // 3. Calculate survival
    const result = calculateSurvival({
      savings: vars.savings,
      usage: vars.usage,
      human: vars.human,
      awarenessCost: vars.awarenessCost,
      frictionCost: vars.frictionCost,
    });

    allScores.push(result.score);

    records.push({
      project,
      categoryId,
      vars,
      source,
      result,
    });
  }

  // 4. Derive tier thresholds from all scores
  const thresholds = deriveTiers(allScores);
  console.log('Tier thresholds:');
  for (const [tier, bounds] of Object.entries(thresholds)) {
    console.log(`  ${tier.padEnd(12)} ${bounds.min.toFixed(1)} - ${bounds.max.toFixed(1)}`);
  }
  console.log('');

  // 5. Assign tiers and store
  const tierCounts = { legendary: 0, strong: 0, competitive: 0, pressured: 0, endangered: 0 };

  await prisma.$transaction(async (tx) => {
    for (const rec of records) {
      const tier = deriveTier(rec.result.score, thresholds);
      tierCounts[tier]++;

      await tx.toolSurvivalScore.create({
        data: {
          toolId: rec.project.id,
          categoryId: rec.categoryId,
          computedAt: now,
          savingsScore: rec.vars.savings,
          usageScore: rec.vars.usage,
          humanScore: rec.vars.human,
          awarenessCost: rec.vars.awarenessCost,
          frictionCost: rec.vars.frictionCost,
          weightSavings: DEFAULT_WEIGHTS.w_s,
          weightUsage: DEFAULT_WEIGHTS.w_u,
          weightHuman: DEFAULT_WEIGHTS.w_h,
          weightAwareness: DEFAULT_WEIGHTS.w_a,
          weightFriction: DEFAULT_WEIGHTS.w_f,
          survivalRatio: rec.result.ratio,
          survivalScore: rec.result.score,
          survivalTier: tier,
          dataPoints: rec.source === 'ai-rating-bootstrap' ? 1 : 0,
          confidence: rec.source === 'ai-rating-bootstrap' ? 0.3 : 0.1,
          tierThresholds: thresholds,
        },
      });
    }

    // 6. Store tier thresholds
    const tierDefs = [
      { name: 'legendary', floor: 95 },
      { name: 'strong', floor: 75 },
      { name: 'competitive', floor: 40 },
      { name: 'pressured', floor: 15 },
      { name: 'endangered', floor: 0 },
    ];

    for (const def of tierDefs) {
      const bounds = thresholds[def.name];
      if (!bounds) continue;
      await tx.tierThreshold.create({
        data: {
          computedAt: now,
          tier: def.name,
          percentileFloor: def.floor,
          scoreMin: bounds.min,
          scoreMax: bounds.max,
          toolCount: tierCounts[def.name],
        },
      });
    }

    // 7. Store initial weight calibration
    await tx.weightCalibration.create({
      data: {
        calibratedAt: now,
        wSavings: DEFAULT_WEIGHTS.w_s,
        wUsage: DEFAULT_WEIGHTS.w_u,
        wHuman: DEFAULT_WEIGHTS.w_h,
        wAwareness: DEFAULT_WEIGHTS.w_a,
        wFriction: DEFAULT_WEIGHTS.w_f,
        trainingSamples: records.length,
        notes: `Bootstrap from ${withRatings.length} AI ratings + ${records.length - withRatings.length} defaults`,
      },
    });
  });

  // 8. Print summary table
  console.log('=== Results ===');
  console.log('');
  console.log(`${'TOOL'.padEnd(25)} ${'CATEGORY'.padEnd(15)} ${'SCORE'.padStart(6)} ${'TIER'.padEnd(12)} ${'S'.padStart(4)} ${'U'.padStart(4)} ${'H'.padStart(4)} ${'Ac'.padStart(4)} ${'Fc'.padStart(4)} SOURCE`);
  console.log('-'.repeat(105));

  const sorted = records.sort((a, b) => b.result.score - a.result.score);
  for (const rec of sorted) {
    const tier = deriveTier(rec.result.score, thresholds);
    console.log(
      `${rec.project.name.padEnd(25)} ${rec.categoryId.padEnd(15)} ${rec.result.score.toFixed(1).padStart(6)} ${tier.padEnd(12)} ${rec.vars.savings.toFixed(1).padStart(4)} ${rec.vars.usage.toFixed(1).padStart(4)} ${rec.vars.human.toFixed(1).padStart(4)} ${rec.vars.awarenessCost.toFixed(1).padStart(4)} ${rec.vars.frictionCost.toFixed(1).padStart(4)} ${rec.source}`
    );
  }

  console.log('');
  console.log('Tier distribution:');
  for (const [tier, count] of Object.entries(tierCounts)) {
    console.log(`  ${tier.padEnd(12)} ${count} tools`);
  }

  console.log('');
  console.log(`Bootstrap complete. ${records.length} tools scored.`);
}

bootstrap()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
