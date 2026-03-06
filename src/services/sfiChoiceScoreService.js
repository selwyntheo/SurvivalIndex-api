// SFI-v3 Choice Score Service
// Per-extraction choice quality scoring

import prisma from '../config/database.js';
import { clamp } from './sfiService.js';

/**
 * Compute a choice score for a single ACES observation/extraction.
 *
 * @param {Object} observation - AcesObservation record
 * @returns {Object} ChoiceScoreRecord fields
 */
export function computeChoiceScore(observation) {
  const scores = {};

  // Survival alignment: was a high-survival tool chosen?
  // This is placeholder — would compare against tool's actual survival score
  scores.survivalAlignment = observation.wasChosen ? 70 : observation.wasCustomDIY ? 30 : 50;

  // Expert endorsement
  if (observation.expertAgreed === true) {
    scores.expertEndorsement = 90;
  } else if (observation.expertAgreed === false) {
    scores.expertEndorsement = 20;
  } else {
    scores.expertEndorsement = 50; // No expert review yet
  }

  // Context fit — based on whether a tool was chosen for its category
  scores.contextFit = observation.wasChosen ? 80 : observation.wasCustomDIY ? 40 : 50;

  // Consistency — placeholder, would require cross-observation analysis
  scores.consistency = 50;

  // Reasoning quality — based on extraction confidence
  scores.reasoningQuality = observation.extractionConfidence
    ? clamp(observation.extractionConfidence * 100, 0, 100)
    : 50;

  // Overall composite
  const weights = {
    survivalAlignment: 0.30,
    expertEndorsement: 0.25,
    contextFit: 0.20,
    consistency: 0.10,
    reasoningQuality: 0.15,
  };

  scores.overallScore = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => sum + scores[key] * weight, 0) * 10
  ) / 10;

  return scores;
}

/**
 * Score all unscored observations.
 */
export async function scoreUnscored() {
  const unscored = await prisma.acesObservation.findMany({
    where: {
      choiceScores: { none: {} },
    },
  });

  let scored = 0;
  for (const obs of unscored) {
    const scores = computeChoiceScore(obs);
    await prisma.choiceScoreRecord.create({
      data: {
        extractionId: obs.id,
        ...scores,
      },
    });
    scored++;
  }

  return { scored, total: unscored.length };
}

export default {
  computeChoiceScore,
  scoreUnscored,
};
