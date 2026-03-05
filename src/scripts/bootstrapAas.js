import dotenv from 'dotenv';
dotenv.config();

import prisma from '../config/database.js';
import { bootstrapFromAIRating } from '../services/aasBootstrapService.js';
import { CATEGORY_MAP } from '../services/aasConstants.js';

async function main() {
  console.log('=== AAS Bootstrap: Mapping AI Ratings → AAS Scores ===\n');

  const projects = await prisma.project.findMany({
    include: { aiRating: true },
  });

  const withRatings = projects.filter(p => p.aiRating);
  console.log(`Found ${projects.length} projects, ${withRatings.length} with AI ratings.\n`);

  if (withRatings.length === 0) {
    console.log('No AI ratings found. Run AI Judge first, then re-run this script.');
    await prisma.$disconnect();
    return;
  }

  let created = 0;
  let skipped = 0;

  const results = [];

  for (const project of withRatings) {
    const categoryId = CATEGORY_MAP[project.category] || project.category?.toLowerCase().replace(/\s+/g, '-') || 'unknown';

    // Check if an AAS score already exists for this tool+category
    const existing = await prisma.aasScore.findFirst({
      where: { toolId: project.id, categoryId },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const aasData = bootstrapFromAIRating(project.aiRating);

    try {
      const record = await prisma.aasScore.create({
        data: {
          toolId: project.id,
          categoryId,
          aas: aasData.aas,
          unpromptedPickRate: aasData.unpromptedPickRate,
          ecosystemPickRate: aasData.ecosystemPickRate,
          considerationRate: aasData.considerationRate,
          contextBreadth: aasData.contextBreadth,
          crossModelConsistency: aasData.crossModelConsistency,
          expertPreference: aasData.expertPreference,
          hiddenGemGap: aasData.hiddenGemGap,
          hiddenGemClass: aasData.hiddenGemClass,
          modelScores: aasData.modelScores,
          dataPoints: aasData.dataPoints,
          confidence: aasData.confidence,
        },
      });

      results.push({
        tool: project.name,
        category: categoryId,
        aas: aasData.aas,
        pickRate: `${Math.round(aasData.unpromptedPickRate * 100)}%`,
        breadth: `${aasData.contextBreadth}/4`,
        models: `${Math.round(aasData.crossModelConsistency * 100)}%`,
        confidence: aasData.confidence,
      });

      created++;
    } catch (err) {
      console.error(`  Failed for ${project.name}: ${err.message}`);
    }
  }

  // Print summary table
  if (results.length > 0) {
    console.log('TOOL'.padEnd(25) + 'CATEGORY'.padEnd(18) + 'AAS'.padEnd(6) + 'PICK%'.padEnd(8) + 'BREADTH'.padEnd(10) + 'MODELS'.padEnd(10) + 'CONF');
    console.log('-'.repeat(85));
    for (const r of results.sort((a, b) => b.aas - a.aas)) {
      console.log(
        r.tool.padEnd(25) +
        r.category.padEnd(18) +
        String(r.aas).padEnd(6) +
        r.pickRate.padEnd(8) +
        r.breadth.padEnd(10) +
        r.models.padEnd(10) +
        r.confidence
      );
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped (already existed).`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Bootstrap failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
