import { classifyHiddenGem } from './aasConstants.js';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Bootstrap AAS scores from existing AIRating data.
 * Maps the 7-lever AI rating scores to approximate AAS values.
 *
 * @param {Object} aiRating - AIRating record from Prisma
 * @returns {Object} AAS-compatible score fields
 */
export function bootstrapFromAIRating(aiRating) {
  const awareness = aiRating.awareness || 5;
  const agentFriction = aiRating.agentFriction || 5;
  const broadUtility = aiRating.broadUtility || 5;

  // Core AAS: map awareness (0-10) directly to 0-100
  const aas = clamp(Math.round(awareness * 10), 0, 100);

  // Unprompted pick rate: agents with low friction get picked more
  // agentFriction is inverted (lower = better), so high value = low friction = high pick rate
  const unpromptedPickRate = clamp(agentFriction / 10, 0, 1);

  // Ecosystem pick rate: approximate from awareness
  const ecosystemPickRate = clamp(awareness / 10, 0, 1);

  // Consideration rate: approximate from awareness (slightly lower than ecosystem)
  const considerationRate = clamp((awareness * 0.8) / 10, 0, 1);

  // Context breadth: map broadUtility (0-10) → 0-4
  const contextBreadth = Math.round(clamp(broadUtility / 2.5, 0, 4));

  // Cross-model consistency: unknown from legacy data
  const crossModelConsistency = 0.5;

  return {
    aas,
    unpromptedPickRate,
    ecosystemPickRate,
    considerationRate,
    contextBreadth,
    crossModelConsistency,
    expertPreference: null,
    hiddenGemGap: null,
    hiddenGemClass: null,
    modelScores: [],
    dataPoints: 0,
    confidence: 0.2, // Low confidence for bootstrapped data
  };
}
