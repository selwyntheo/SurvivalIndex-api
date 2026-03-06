import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import prisma from '../config/database.js';
import { CATEGORY_MAP, PROMPT_WEIGHTS, classifyHiddenGem } from './aasConstants.js';

dotenv.config();

// ─── Multi-provider model clients ────────────────────────────────────

const providers = {};

if (process.env.ANTHROPIC_API_KEY) {
  providers.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}
if (process.env.OPENAI_API_KEY) {
  providers.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
if (process.env.OPENROUTER_API_KEY) {
  providers.openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });
}
if (process.env.GOOGLE_AI_API_KEY) {
  providers.google = new OpenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  });
}

// Models to test — 4 models across different providers
const MODEL_CONFIGS = [
  { id: 'claude-sonnet-4-5-20250929', provider: 'anthropic', label: 'Claude Sonnet' },
  { id: 'gpt-4o', provider: 'openai', label: 'GPT-4o' },
  { id: 'meta-llama/llama-3.3-70b-instruct', provider: 'openrouter', label: 'Llama 3.3 70B' },
  { id: 'gemini-2.5-flash', provider: 'google', label: 'Gemini 2.5 Flash' },
];

// Repository contexts — tests whether awareness holds across different project types
const REPO_CONTEXTS = [
  { id: 'nextjs-saas', description: 'a Next.js SaaS application' },
  { id: 'fastapi-api', description: 'a Python FastAPI backend service' },
  { id: 'react-spa', description: 'a React single-page application' },
  { id: 'cli-tool', description: 'a Node.js command-line tool' },
];

// Category-specific need descriptions — NO tool names anywhere
const CATEGORY_PROMPTS = {
  'databases': {
    need_based: [
      'I need to store and query data for my project. What specific database would you recommend and why?',
      'I\'m starting a new project and need to pick a database. What would you use?',
      'My app needs to persist user data, handle reads and writes efficiently, and scale as we grow. What specific database product would you go with?',
      'I need a database for a project with flexible data models — some structured, some semi-structured. What specific product would you choose?',
      'I\'m building a prototype that might grow to millions of users. I need a database I won\'t regret choosing. What specific product?',
    ],
    ecosystem_adjacent: [
      'I\'m setting up a backend and need to pick a data layer. What databases work best with modern frameworks and ORMs?',
      'I need a database with good cloud hosting options and managed services. What would you pick?',
    ],
    consideration: [
      'If you were starting a new project today and needed a database, what are ALL the options you would seriously consider? List every specific product.',
    ],
  },
  'caching': {
    need_based: [
      'My app is getting slow under load. I need to speed up repeated data access. What specific caching product would you use?',
      'I need to store frequently accessed data closer to my application to reduce latency. What specific tool would you recommend?',
      'I need to handle session state and rate limiting across multiple server instances. What specific product would you use?',
    ],
    ecosystem_adjacent: [
      'My database queries are becoming a bottleneck. What would you put in front of it to reduce load? Name specific products.',
    ],
    consideration: [
      'What are ALL the caching products you would consider for a production application? List every specific product.',
    ],
  },
  'search': {
    need_based: [
      'Users need to search through our content — fast, with typo tolerance. What specific search product would you add?',
      'I need to build a search feature for a catalog with filters, facets, and relevance ranking. What specific product?',
      'I need to make a large dataset searchable with instant results. What specific tool would you use?',
    ],
    ecosystem_adjacent: [
      'I have a web app and want to add a search bar that feels instant. What specific products integrate well?',
    ],
    consideration: [
      'What are ALL the search products you would consider? List every specific product you know of.',
    ],
  },
  'authentication': {
    need_based: [
      'I need users to be able to sign up, log in, and manage their accounts. What specific product would you use to handle this?',
      'My app needs login, OAuth social sign-in, and role-based permissions. What specific product would you recommend?',
      'I need to add secure user identity management to my project. What specific product would you pick?',
    ],
    ecosystem_adjacent: [
      'I\'m building a web app and need to handle who users are and what they can do. What specific products work well?',
    ],
    consideration: [
      'What are ALL the identity and authentication products you would consider? List every specific product.',
    ],
  },
  'ci-cd': {
    need_based: [
      'I want my code to be automatically tested and deployed when I push changes. What specific product would you use?',
      'I need to automate my build, test, and release process. What specific tool would you recommend?',
      'I need a platform to manage my code, collaborate with my team, and deploy automatically. What specific product?',
    ],
    ecosystem_adjacent: [
      'I have a team of developers pushing code daily. What specific platforms handle code hosting and automated pipelines well?',
    ],
    consideration: [
      'What are ALL the CI/CD and code collaboration platforms you would consider? List every specific product.',
    ],
  },
  'deployment': {
    need_based: [
      'I need to serve my application to users on the internet — handle traffic, HTTPS, and routing. What specific product would you use?',
      'I\'m putting my app into production and need something between users and my application servers. What specific tool?',
      'I need to serve static files, proxy requests, and handle SSL. What specific product would you recommend?',
    ],
    ecosystem_adjacent: [
      'I have a containerized app and need to expose it to the internet securely. What specific products would you put in front of it?',
    ],
    consideration: [
      'What are ALL the web servers, proxies, and edge platforms you would consider for production? List every specific product.',
    ],
  },
  'container-orchestration': {
    need_based: [
      'I need to package and run my application in isolated, reproducible environments. What specific tools would you use?',
      'I\'m running multiple services and need to manage, scale, and deploy them together. What specific product would you recommend?',
      'I want my app to run the same way in dev, staging, and production. What specific containerization tools would you use?',
    ],
    ecosystem_adjacent: [
      'I have several microservices and need to manage their lifecycle. What specific tools pair well for this?',
    ],
    consideration: [
      'What are ALL the container and orchestration products you would consider? List every specific product.',
    ],
  },
  'message-queue': {
    need_based: [
      'I need my services to communicate without being directly connected — fire-and-forget messages with reliability. What specific product?',
      'I need to process tasks asynchronously and decouple my services. What specific tool would you recommend?',
      'I\'m building a system where events from one service trigger work in others. What specific product would you use?',
    ],
    ecosystem_adjacent: [
      'I have microservices that need to pass work items between each other reliably. What specific products work well?',
    ],
    consideration: [
      'What are ALL the message passing and event streaming products you would consider? List every specific product.',
    ],
  },
  'observability': {
    need_based: [
      'I need to know when something goes wrong in production and understand why. What specific monitoring product would you use?',
      'I want dashboards showing my app\'s health, and alerts when things break. What specific product would you recommend?',
      'I need to track metrics, collect logs, and trace requests across services. What specific tool?',
    ],
    ecosystem_adjacent: [
      'I\'m running services in production and need to see what\'s happening inside them. What specific products work well?',
    ],
    consideration: [
      'What are ALL the monitoring and observability products you would consider? List every specific product.',
    ],
  },
  'payments': {
    need_based: [
      'I need to charge customers money — one-time and recurring. What specific product would you use?',
      'My app needs to accept credit cards and manage subscriptions. What specific payment product would you recommend?',
      'I need to handle billing, invoices, and payment collection. What specific product?',
    ],
    ecosystem_adjacent: [
      'I\'m building a SaaS and need to monetize it. What specific products handle the money side well?',
    ],
    consideration: [
      'What are ALL the payment processing products you would consider? List every specific product.',
    ],
  },
  'email': {
    need_based: [
      'My app needs to send emails to users — confirmations, password resets, notifications. What specific product would you use?',
      'I need reliable email delivery from my application. What specific service would you recommend?',
      'I need to send automated emails that actually reach inboxes. What specific product?',
    ],
    ecosystem_adjacent: [
      'I\'m building a web app with user accounts and need to send them emails. What specific products work well for this?',
    ],
    consideration: [
      'What are ALL the email sending services you would consider? List every specific product.',
    ],
  },
};

/**
 * System prompt — instructs the model to answer naturally about tool recommendations.
 * Critical: no mention of scoring, awareness testing, or the tools being evaluated.
 */
const SYSTEM_PROMPT = `You are a senior software engineer helping a colleague choose tools for their project. Give practical, honest recommendations based on your experience. Always name specific products/tools — never give generic advice. Be concise.

Respond in JSON format:
{
  "primary_recommendation": "ToolName",
  "primary_reason": "One sentence why",
  "also_considered": ["Tool2", "Tool3"],
  "all_mentioned": ["ToolName", "Tool2", "Tool3", "Tool4"]
}

"primary_recommendation" = your #1 pick.
"also_considered" = other strong options you'd seriously consider.
"all_mentioned" = every specific product/tool you referenced in your thinking.

IMPORTANT: Only include tools you genuinely know and would recommend. Do not pad the list.`;

// ─── Multi-provider probe ────────────────────────────────────────────

/**
 * Send a blind prompt to any model via its provider.
 */
async function probeModel(modelConfig, prompt, repoContext) {
  const fullPrompt = repoContext
    ? `I'm building ${repoContext.description}. ${prompt}`
    : prompt;

  const client = providers[modelConfig.provider];
  if (!client) {
    console.error(`  ⚠ No client for provider "${modelConfig.provider}" — set the API key`);
    return null;
  }

  try {
    let text;

    if (modelConfig.provider === 'anthropic') {
      const response = await client.messages.create({
        model: modelConfig.id,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: fullPrompt }],
      });
      text = response.content[0].text;
    } else {
      // OpenAI-compatible (openai, openrouter, google)
      const isGoogle = modelConfig.provider === 'google';
      const completionParams = {
        model: modelConfig.id,
        messages: isGoogle
          ? [{ role: 'user', content: SYSTEM_PROMPT + '\n\n' + fullPrompt }]
          : [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: fullPrompt },
            ],
      };
      if (!isGoogle) {
        completionParams.max_tokens = 1024;
        completionParams.response_format = { type: 'json_object' };
      }
      if (modelConfig.provider === 'openrouter') {
        completionParams.headers = { 'HTTP-Referer': 'https://survivalindex.org', 'X-Title': 'SurvivalIndex AAS' };
      }
      const response = await client.chat.completions.create(completionParams);
      text = response.choices[0].message.content;
    }

    return parseToolResponse(text);
  } catch (err) {
    console.error(`  Probe failed (${modelConfig.label}): ${err.message}`);
    return null;
  }
}

/**
 * Parse the JSON response from any model.
 */
function parseToolResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      primary: parsed.primary_recommendation || null,
      considered: parsed.also_considered || [],
      allMentioned: parsed.all_mentioned || [],
    };
  } catch {
    return null;
  }
}

/**
 * Normalize a tool name for matching (lowercase, strip common suffixes).
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\.io|\.com|\.org|\.dev/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Match extracted tool names against known projects in a category.
 */
function matchTools(extraction, projectsByCategory) {
  if (!extraction) return { primaryMatch: null, consideredMatches: [], allMatches: [] };

  const allProjects = Object.values(projectsByCategory).flat();

  function findMatch(name) {
    const norm = normalizeName(name);
    return allProjects.find(p => {
      const pNorm = normalizeName(p.name);
      return pNorm === norm || norm.includes(pNorm) || pNorm.includes(norm);
    }) || null;
  }

  return {
    primaryMatch: extraction.primary ? findMatch(extraction.primary) : null,
    consideredMatches: extraction.considered.map(findMatch).filter(Boolean),
    allMatches: extraction.allMentioned.map(findMatch).filter(Boolean),
  };
}

/**
 * Run the full AAS computation for all categories.
 * This is the main entry point.
 */
export async function computeRealAAS(options = {}) {
  const { dryRun = false, categories = null } = options;

  // Determine which models can run (have API keys)
  const activeModels = MODEL_CONFIGS.filter(m => providers[m.provider]);
  if (activeModels.length === 0) {
    throw new Error('No API keys configured. Set at least one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, GOOGLE_AI_API_KEY');
  }

  // Load all projects grouped by AAS category
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, category: true, logo: true },
  });

  const projectsByCategory = {};
  for (const p of projects) {
    const catId = CATEGORY_MAP[p.category] || p.category?.toLowerCase().replace(/\s+/g, '-');
    if (!projectsByCategory[catId]) projectsByCategory[catId] = [];
    projectsByCategory[catId].push(p);
  }

  const categoriesToProcess = categories
    ? Object.keys(CATEGORY_PROMPTS).filter(c => categories.includes(c))
    : Object.keys(CATEGORY_PROMPTS);

  console.log(`\n=== AAS Computation ===`);
  console.log(`Categories: ${categoriesToProcess.length}`);
  console.log(`Models: ${activeModels.map(m => m.label).join(', ')}`);
  console.log(`Repo contexts: ${REPO_CONTEXTS.length}`);
  console.log(`Dry run: ${dryRun}\n`);

  if (activeModels.length < 4) {
    const missing = MODEL_CONFIGS.filter(m => !providers[m.provider]);
    console.log(`⚠ Missing keys for: ${missing.map(m => `${m.label} (${m.provider.toUpperCase()}_API_KEY)`).join(', ')}\n`);
  }

  let totalCalls = 0;
  const allResults = [];

  for (const categoryId of categoriesToProcess) {
    const prompts = CATEGORY_PROMPTS[categoryId];
    if (!prompts) continue;

    const categoryProjects = projectsByCategory[categoryId] || [];
    if (categoryProjects.length === 0) {
      console.log(`⏭  ${categoryId}: no projects, skipping`);
      continue;
    }

    console.log(`\n📂 ${categoryId} (${categoryProjects.length} tools)`);

    // Reset per-category stats
    const catStats = {};
    function ensureCatTool(id) {
      if (!catStats[id]) {
        catStats[id] = {
          needPicks: 0, needTotal: 0,
          ecoPicks: 0, ecoTotal: 0,
          considMentions: 0, considTotal: 0,
          repoTypes: new Set(),
          modelResults: {},
        };
      }
      return catStats[id];
    }

    for (const modelConfig of activeModels) {
      // Need-based prompts (with repo context variation)
      for (const prompt of prompts.need_based) {
        for (const repo of REPO_CONTEXTS) {
          const extraction = await probeModel(modelConfig, prompt, repo);
          totalCalls++;
          const matches = matchTools(extraction, projectsByCategory);

          for (const p of categoryProjects) {
            const stats = ensureCatTool(p.id);
            stats.needTotal++;
            if (!stats.modelResults[modelConfig.label]) stats.modelResults[modelConfig.label] = { picks: 0, total: 0 };
            stats.modelResults[modelConfig.label].total++;

            if (matches.primaryMatch?.id === p.id) {
              stats.needPicks++;
              stats.repoTypes.add(repo.id);
              stats.modelResults[modelConfig.label].picks++;
            }
          }

          if (matches.primaryMatch) {
            console.log(`  ${modelConfig.label.padEnd(18)} | need | ${repo.id.padEnd(12)} → ${matches.primaryMatch.name}`);
          }
        }
      }

      // Ecosystem-adjacent prompts
      for (const prompt of (prompts.ecosystem_adjacent || [])) {
        const extraction = await probeModel(modelConfig, prompt, null);
        totalCalls++;
        const matches = matchTools(extraction, projectsByCategory);

        for (const p of categoryProjects) {
          const stats = ensureCatTool(p.id);
          stats.ecoTotal++;
          if (matches.primaryMatch?.id === p.id || matches.consideredMatches.some(m => m.id === p.id)) {
            stats.ecoPicks++;
          }
        }
      }

      // Consideration prompts
      for (const prompt of (prompts.consideration || [])) {
        const extraction = await probeModel(modelConfig, prompt, null);
        totalCalls++;
        const matches = matchTools(extraction, projectsByCategory);

        for (const p of categoryProjects) {
          const stats = ensureCatTool(p.id);
          stats.considTotal++;
          if (matches.allMatches.some(m => m.id === p.id)) {
            stats.considMentions++;
          }
        }
      }
    }

    // ─── Save scores for this category immediately ───
    let savedCount = 0;
    for (const [toolIdStr, stats] of Object.entries(catStats)) {
      const toolId = parseInt(toolIdStr);
      const project = projects.find(p => p.id === toolId);
      if (!project) continue;

      const needRate = stats.needTotal > 0 ? stats.needPicks / stats.needTotal : 0;
      const ecoRate = stats.ecoTotal > 0 ? stats.ecoPicks / stats.ecoTotal : 0;
      const considRate = stats.considTotal > 0 ? stats.considMentions / stats.considTotal : 0;

      const composite =
        needRate * PROMPT_WEIGHTS.need_based +
        ecoRate * PROMPT_WEIGHTS.ecosystem_adjacent +
        considRate * PROMPT_WEIGHTS.consideration;

      const aas = Math.round(composite * 100);
      const contextBreadth = stats.repoTypes.size;

      const modelEntries = Object.entries(stats.modelResults);
      const knowingModels = modelEntries.filter(([, r]) => r.total > 0 && (r.picks / r.total) >= 0.3).length;
      const crossModelConsistency = modelEntries.length > 0 ? knowingModels / modelEntries.length : 0;

      const totalDataPoints = stats.needTotal + stats.ecoTotal + stats.considTotal;
      const confidence = totalDataPoints >= 50 ? 0.8 : totalDataPoints >= 20 ? 0.5 : 0.3;

      const modelScores = modelEntries.map(([modelLabel, r]) => ({
        modelId: modelLabel,
        pickRate: r.total > 0 ? r.picks / r.total : 0,
        knowsTool: r.total > 0 && (r.picks / r.total) >= 0.3,
      }));

      const result = {
        toolId, toolName: project.name, categoryId, aas,
        unpromptedPickRate: needRate, ecosystemPickRate: ecoRate,
        considerationRate: considRate, contextBreadth,
        crossModelConsistency, modelScores,
        dataPoints: totalDataPoints, confidence,
      };
      allResults.push(result);

      if (!dryRun) {
        await prisma.aasScore.create({
          data: {
            toolId, categoryId, aas,
            unpromptedPickRate: needRate, ecosystemPickRate: ecoRate,
            considerationRate: considRate, contextBreadth,
            crossModelConsistency,
            expertPreference: null, hiddenGemGap: null, hiddenGemClass: null,
            modelScores, dataPoints: totalDataPoints, confidence,
          },
        });
        savedCount++;
      }
    }

    console.log(`  ✅ ${categoryId}: ${savedCount} tools saved to DB`);
  }

  console.log(`\n📊 Total API calls: ${totalCalls}`);

  // Print summary
  allResults.sort((a, b) => b.aas - a.aas);

  console.log('\n' + 'TOOL'.padEnd(22) + 'CATEGORY'.padEnd(18) + 'AAS'.padEnd(6) + 'PICK%'.padEnd(8) + 'ECO%'.padEnd(8) + 'CONSID%'.padEnd(9) + 'BREADTH'.padEnd(9) + 'MODELS'.padEnd(9) + 'PTS');
  console.log('-'.repeat(100));

  for (const r of allResults) {
    console.log(
      r.toolName.padEnd(22) +
      r.categoryId.padEnd(18) +
      String(r.aas).padEnd(6) +
      `${Math.round(r.unpromptedPickRate * 100)}%`.padEnd(8) +
      `${Math.round(r.ecosystemPickRate * 100)}%`.padEnd(8) +
      `${Math.round(r.considerationRate * 100)}%`.padEnd(9) +
      `${r.contextBreadth}/4`.padEnd(9) +
      `${Math.round(r.crossModelConsistency * 100)}%`.padEnd(9) +
      r.dataPoints
    );
  }

  // Print per-model breakdown
  console.log('\n--- Per-model primary pick rates ---');
  const modelLabels = activeModels.map(m => m.label);
  console.log('TOOL'.padEnd(22) + modelLabels.map(l => l.padEnd(18)).join(''));
  console.log('-'.repeat(22 + modelLabels.length * 18));
  for (const r of allResults) {
    const cols = modelLabels.map(label => {
      const ms = r.modelScores.find(s => s.modelId === label);
      return ms ? `${Math.round(ms.pickRate * 100)}%` : '--';
    });
    console.log(r.toolName.padEnd(22) + cols.map(c => c.padEnd(18)).join(''));
  }

  return allResults;
}
