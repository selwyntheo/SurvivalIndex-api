// SFI-v3 Formula Service
// Log-linear survival formula, tier derivation, and confidence calculation

export const FORMULA_VERSION = 'v3.0';

export const DEFAULT_WEIGHTS = {
  w_s: 1.0,  // savings
  w_u: 0.8,  // usage
  w_h: 0.6,  // human coefficient
  w_a: 1.0,  // awareness cost
  w_f: 1.0,  // friction cost
};

export const TIER_DEFINITIONS = [
  { name: 'legendary',   percentileFloor: 95 },
  { name: 'strong',      percentileFloor: 75 },
  { name: 'competitive', percentileFloor: 40 },
  { name: 'pressured',   percentileFloor: 15 },
  { name: 'endangered',  percentileFloor: 0 },
];

// Fixed fallback thresholds when not enough tools for percentile derivation
export const FIXED_FALLBACK_THRESHOLDS = {
  legendary:   { min: 82, max: 100 },
  strong:      { min: 65, max: 81.99 },
  competitive: { min: 45, max: 64.99 },
  pressured:   { min: 25, max: 44.99 },
  endangered:  { min: 0,  max: 24.99 },
};

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Calculate survival score using the log-linear formula.
 *
 * S(T) = exp(w_s*ln(s) + w_u*ln(u) + w_h*ln(h) - w_a*ln(a) - w_f*ln(f))
 * Score = clamp(50 + 15 * ln(ratio), 0, 100)
 *
 * @param {Object} components - { savings, usage, human, awarenessCost, frictionCost } all 1-10
 * @param {Object} weights - { w_s, w_u, w_h, w_a, w_f }
 * @returns {Object} { ratio, score, tier, components, confidence }
 */
export function calculateSurvival(components, weights = DEFAULT_WEIGHTS) {
  const s = clamp(components.savings, 1, 10);
  const u = clamp(components.usage, 1, 10);
  const h = clamp(components.human, 1, 10);
  const a = clamp(components.awarenessCost, 1, 10);
  const f = clamp(components.frictionCost, 1, 10);

  const logRatio =
    weights.w_s * Math.log(s) +
    weights.w_u * Math.log(u) +
    weights.w_h * Math.log(h) -
    weights.w_a * Math.log(a) -
    weights.w_f * Math.log(f);

  const ratio = Math.exp(logRatio);
  const score = clamp(50 + 15 * logRatio, 0, 100);
  const roundedScore = Math.round(score * 10) / 10;

  // Use fallback thresholds for individual calculations
  const tier = deriveTier(roundedScore, FIXED_FALLBACK_THRESHOLDS);

  return {
    ratio: Math.round(ratio * 1000) / 1000,
    score: roundedScore,
    tier,
    components: { savings: s, usage: u, human: h, awarenessCost: a, frictionCost: f },
    weights: { ...weights },
  };
}

/**
 * Derive percentile-based tier thresholds from a set of scores.
 * Returns a map of tier → { min, max }.
 */
export function deriveTiers(allScores) {
  if (!allScores || allScores.length < 10) {
    return { ...FIXED_FALLBACK_THRESHOLDS };
  }

  const sorted = [...allScores].sort((a, b) => a - b);
  const n = sorted.length;

  function percentileValue(p) {
    const idx = Math.floor((p / 100) * (n - 1));
    return sorted[idx];
  }

  const thresholds = {};
  for (let i = 0; i < TIER_DEFINITIONS.length; i++) {
    const tier = TIER_DEFINITIONS[i];
    const floor = percentileValue(tier.percentileFloor);
    const ceiling = i === 0 ? 100 : percentileValue(TIER_DEFINITIONS[i - 1].percentileFloor) - 0.01;
    thresholds[tier.name] = {
      min: Math.round(floor * 100) / 100,
      max: Math.round(ceiling * 100) / 100,
    };
  }

  // Fix boundaries
  thresholds.legendary.max = 100;
  thresholds.endangered.min = 0;

  return thresholds;
}

/**
 * Determine tier from score using given thresholds.
 */
export function deriveTier(score, thresholds) {
  const t = thresholds || FIXED_FALLBACK_THRESHOLDS;
  if (score >= t.legendary.min)   return 'legendary';
  if (score >= t.strong.min)      return 'strong';
  if (score >= t.competitive.min) return 'competitive';
  if (score >= t.pressured.min)   return 'pressured';
  return 'endangered';
}

/**
 * Calculate confidence score from data quality signals.
 * Returns 0-1 value.
 */
export function calculateConfidence(toolData) {
  const weights = {
    execution: 0.30,
    evaluation: 0.25,
    modelCoverage: 0.15,
    repoTypes: 0.15,
    freshness: 0.15,
  };

  let confidence = 0;

  // Execution count — more observations = higher confidence
  const observations = toolData.observationCount || 0;
  const executionScore = Math.min(observations / 20, 1); // 20+ obs = full score
  confidence += executionScore * weights.execution;

  // Expert evaluation coverage
  const expertReviewed = toolData.expertReviewedCount || 0;
  const evalScore = observations > 0 ? Math.min(expertReviewed / observations, 1) : 0;
  confidence += evalScore * weights.evaluation;

  // Model coverage — how many distinct models have data
  const modelCount = toolData.distinctModels || 0;
  const modelScore = Math.min(modelCount / 3, 1); // 3+ models = full
  confidence += modelScore * weights.modelCoverage;

  // Repo type coverage
  const repoTypes = toolData.distinctRepoTypes || 0;
  const repoScore = Math.min(repoTypes / 3, 1); // 3+ types = full
  confidence += repoScore * weights.repoTypes;

  // Freshness — penalize stale data
  const daysSinceLastObs = toolData.daysSinceLastObservation ?? 365;
  const freshnessScore = daysSinceLastObs <= 30 ? 1 : daysSinceLastObs <= 90 ? 0.7 : daysSinceLastObs <= 180 ? 0.4 : 0.1;
  confidence += freshnessScore * weights.freshness;

  return Math.round(confidence * 100) / 100;
}

export default {
  FORMULA_VERSION,
  DEFAULT_WEIGHTS,
  TIER_DEFINITIONS,
  FIXED_FALLBACK_THRESHOLDS,
  clamp,
  calculateSurvival,
  deriveTiers,
  deriveTier,
  calculateConfidence,
};
