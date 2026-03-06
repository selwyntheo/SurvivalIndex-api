import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import prisma from '../config/database.js';
import { CATEGORY_MAP, PROMPT_WEIGHTS, classifyHiddenGem } from './aasConstants.js';

dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Models to test awareness across
const MODELS = [
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001',
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
      'I need a relational database for my project. It needs to handle complex queries, transactions, and scale well. What specific database software would you recommend and why?',
      'I\'m choosing a primary database for a new web application. I need something reliable, well-documented, and with good ecosystem support. What specific products would you suggest?',
      'What database would you use for a production application that needs ACID compliance, JSON support, and good performance? Name specific products.',
    ],
    ecosystem_adjacent: [
      'I\'m setting up a backend with an ORM layer. What databases pair well with modern ORMs? Name specific products.',
      'I need a database that works well in containerized environments and has good cloud hosting options. What would you pick?',
    ],
    consideration: [
      'If you were starting a new project today and needed to choose a database, what are ALL the options you would seriously consider? List every specific product.',
    ],
  },
  'caching': {
    need_based: [
      'I need an in-memory caching layer for my application to reduce database load and speed up reads. What specific caching software would you recommend?',
      'My API responses are slow and I need to add a cache. What caching solutions would you use? Name specific products.',
      'I need a distributed cache that can handle session storage and rate limiting. What specific tools would you recommend?',
    ],
    ecosystem_adjacent: [
      'I\'m running a web app with a relational database and need to add a caching layer in front of it. What specific cache products pair well?',
    ],
    consideration: [
      'What are ALL the caching solutions you would consider for a production application? List every specific product.',
    ],
  },
  'search': {
    need_based: [
      'I need to add full-text search to my application. Users need to search across millions of documents with typo tolerance and faceted filtering. What specific search engines would you recommend?',
      'I\'m building a product catalog with search functionality. What search solutions would you use? Name specific products.',
    ],
    ecosystem_adjacent: [
      'I have a web application and need to add fast, relevant search. What search engines integrate well with modern web stacks?',
    ],
    consideration: [
      'What are ALL the search solutions you would consider for a production application? List every specific product you know of.',
    ],
  },
  'authentication': {
    need_based: [
      'I need to add user authentication to my application — signup, login, password reset, OAuth, and role-based access. What specific auth solutions would you recommend?',
      'I\'m building a multi-tenant SaaS and need an identity provider. What specific products would you use?',
    ],
    ecosystem_adjacent: [
      'I\'m building a React frontend with a Node.js backend and need auth. What specific identity/auth products integrate well?',
    ],
    consideration: [
      'What are ALL the authentication solutions you would seriously consider for a production web application? List every specific product.',
    ],
  },
  'ci-cd': {
    need_based: [
      'I need to set up continuous integration and deployment for my project. What specific CI/CD platforms or tools would you recommend?',
      'I want automated testing and deployment pipelines. What specific CI/CD solutions would you use?',
    ],
    ecosystem_adjacent: [
      'I\'m hosting my code and need CI/CD integrated with my repository. What specific platforms would you use?',
    ],
    consideration: [
      'What are ALL the CI/CD solutions and version control platforms you would consider? List every specific product.',
    ],
  },
  'deployment': {
    need_based: [
      'I need a web server or reverse proxy to serve my application in production. What specific software would you recommend?',
      'I\'m deploying a web application and need something to handle HTTPS, load balancing, and static file serving. What specific tools would you use?',
    ],
    ecosystem_adjacent: [
      'I\'m containerizing my app and need a reverse proxy and CDN in front of it. What specific products would you use?',
    ],
    consideration: [
      'What are ALL the web servers, reverse proxies, and CDN/edge platforms you would consider for a production deployment? List every specific product.',
    ],
  },
  'container-orchestration': {
    need_based: [
      'I need to containerize and orchestrate my microservices in production. What specific container and orchestration tools would you recommend?',
      'I\'m deploying multiple services and need container management. What specific tools would you use?',
    ],
    ecosystem_adjacent: [
      'I\'m building a cloud-native application with multiple services. What container tools pair well with modern CI/CD?',
    ],
    consideration: [
      'What are ALL the container and orchestration tools you would consider? List every specific product.',
    ],
  },
  'message-queue': {
    need_based: [
      'I need a message queue or event streaming platform for asynchronous processing between my services. What specific message broker software would you recommend?',
      'I\'m building an event-driven architecture and need reliable message passing. What specific tools would you use?',
    ],
    ecosystem_adjacent: [
      'I have microservices that need to communicate asynchronously. What message brokers pair well with containerized deployments?',
    ],
    consideration: [
      'What are ALL the message queues and event streaming platforms you would consider? List every specific product.',
    ],
  },
  'observability': {
    need_based: [
      'I need monitoring, metrics collection, and dashboards for my production services. What specific observability tools would you recommend?',
      'I want to set up alerting, log aggregation, and performance monitoring. What specific products would you use?',
    ],
    ecosystem_adjacent: [
      'I\'m running services on containers and need observability. What monitoring tools integrate well with container orchestration?',
    ],
    consideration: [
      'What are ALL the monitoring, metrics, and observability tools you would consider? List every specific product.',
    ],
  },
  'payments': {
    need_based: [
      'I need to add payment processing to my web application — credit cards, subscriptions, and invoicing. What specific payment platforms would you recommend?',
      'I\'m building an e-commerce site and need to accept payments. What specific payment solutions would you use?',
    ],
    ecosystem_adjacent: [
      'I\'m building a SaaS with recurring billing. What payment platforms integrate well with modern web frameworks?',
    ],
    consideration: [
      'What are ALL the payment processing platforms you would consider for a production application? List every specific product.',
    ],
  },
  'email': {
    need_based: [
      'I need to send transactional emails from my application — password resets, notifications, receipts. What specific email delivery services would you recommend?',
      'I\'m building a SaaS that needs reliable email sending. What specific email platforms would you use?',
    ],
    ecosystem_adjacent: [
      'I\'m building a web app with user accounts. What email services pair well for sending transactional messages?',
    ],
    consideration: [
      'What are ALL the transactional email services you would consider? List every specific product.',
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

/**
 * Send a single blind prompt to a model and extract tool mentions.
 */
async function probeModel(model, prompt, repoContext) {
  const fullPrompt = repoContext
    ? `I'm building ${repoContext.description}. ${prompt}`
    : prompt;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: fullPrompt }],
    });

    const text = response.content[0].text;
    return parseToolResponse(text);
  } catch (err) {
    console.error(`  Probe failed (${model}): ${err.message}`);
    return null;
  }
}

/**
 * Parse the JSON response from the model.
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
    // Fallback: extract tool names from plain text
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
      // Exact match or substring match
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
  const { dryRun = false, categories = null, models = MODELS } = options;

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
  console.log(`Models: ${models.join(', ')}`);
  console.log(`Repo contexts: ${REPO_CONTEXTS.length}`);
  console.log(`Dry run: ${dryRun}\n`);

  // Track results per tool: { [toolId]: { needPicks, needTotal, ecoPicks, ecoTotal, considMentions, considTotal, repoTypes, modelResults } }
  const toolStats = {};

  function ensureTool(toolId) {
    if (!toolStats[toolId]) {
      toolStats[toolId] = {
        needPicks: 0, needTotal: 0,
        ecoPicks: 0, ecoTotal: 0,
        considMentions: 0, considTotal: 0,
        repoTypes: new Set(),
        modelResults: {}, // { [modelId]: { picks, total } }
      };
    }
    return toolStats[toolId];
  }

  let totalCalls = 0;

  for (const categoryId of categoriesToProcess) {
    const prompts = CATEGORY_PROMPTS[categoryId];
    if (!prompts) continue;

    const categoryProjects = projectsByCategory[categoryId] || [];
    if (categoryProjects.length === 0) {
      console.log(`⏭  ${categoryId}: no projects, skipping`);
      continue;
    }

    console.log(`\n📂 ${categoryId} (${categoryProjects.length} tools)`);

    for (const model of models) {
      const modelShort = model.split('-').slice(0, 3).join('-');

      // Need-based prompts (with repo context variation)
      for (const prompt of prompts.need_based) {
        for (const repo of REPO_CONTEXTS) {
          const extraction = await probeModel(model, prompt, repo);
          totalCalls++;
          const matches = matchTools(extraction, projectsByCategory);

          // Mark all category tools for this prompt
          for (const p of categoryProjects) {
            const stats = ensureTool(p.id);
            stats.needTotal++;
            if (!stats.modelResults[model]) stats.modelResults[model] = { picks: 0, total: 0 };
            stats.modelResults[model].total++;

            if (matches.primaryMatch?.id === p.id) {
              stats.needPicks++;
              stats.repoTypes.add(repo.id);
              stats.modelResults[model].picks++;
            }
          }

          if (matches.primaryMatch) {
            console.log(`  ${modelShort} | need | ${repo.id.padEnd(12)} → ${matches.primaryMatch.name}`);
          }
        }
      }

      // Ecosystem-adjacent prompts
      for (const prompt of (prompts.ecosystem_adjacent || [])) {
        const extraction = await probeModel(model, prompt, null);
        totalCalls++;
        const matches = matchTools(extraction, projectsByCategory);

        for (const p of categoryProjects) {
          const stats = ensureTool(p.id);
          stats.ecoTotal++;
          if (matches.primaryMatch?.id === p.id || matches.consideredMatches.some(m => m.id === p.id)) {
            stats.ecoPicks++;
          }
        }
      }

      // Consideration prompts
      for (const prompt of (prompts.consideration || [])) {
        const extraction = await probeModel(model, prompt, null);
        totalCalls++;
        const matches = matchTools(extraction, projectsByCategory);

        for (const p of categoryProjects) {
          const stats = ensureTool(p.id);
          stats.considTotal++;
          if (matches.allMatches.some(m => m.id === p.id)) {
            stats.considMentions++;
          }
        }
      }
    }
  }

  console.log(`\n📊 Total API calls: ${totalCalls}`);

  // Calculate AAS for each tool and store
  const results = [];

  for (const [toolIdStr, stats] of Object.entries(toolStats)) {
    const toolId = parseInt(toolIdStr);
    const project = projects.find(p => p.id === toolId);
    if (!project) continue;

    const categoryId = CATEGORY_MAP[project.category] || project.category?.toLowerCase().replace(/\s+/g, '-');

    const needRate = stats.needTotal > 0 ? stats.needPicks / stats.needTotal : 0;
    const ecoRate = stats.ecoTotal > 0 ? stats.ecoPicks / stats.ecoTotal : 0;
    const considRate = stats.considTotal > 0 ? stats.considMentions / stats.considTotal : 0;

    // Weighted composite
    const composite =
      needRate * PROMPT_WEIGHTS.need_based +
      ecoRate * PROMPT_WEIGHTS.ecosystem_adjacent +
      considRate * PROMPT_WEIGHTS.consideration;

    const aas = Math.round(composite * 100);
    const contextBreadth = stats.repoTypes.size; // 0-4

    // Cross-model consistency
    const modelEntries = Object.entries(stats.modelResults);
    const knowingModels = modelEntries.filter(([, r]) => r.total > 0 && (r.picks / r.total) >= 0.3).length;
    const crossModelConsistency = modelEntries.length > 0 ? knowingModels / modelEntries.length : 0;

    const totalDataPoints = stats.needTotal + stats.ecoTotal + stats.considTotal;
    const confidence = totalDataPoints >= 50 ? 0.8 : totalDataPoints >= 20 ? 0.5 : 0.3;

    const modelScores = modelEntries.map(([modelId, r]) => ({
      modelId,
      pickRate: r.total > 0 ? r.picks / r.total : 0,
      knowsTool: r.total > 0 && (r.picks / r.total) >= 0.3,
    }));

    const result = {
      toolId,
      toolName: project.name,
      categoryId,
      aas,
      unpromptedPickRate: needRate,
      ecosystemPickRate: ecoRate,
      considerationRate: considRate,
      contextBreadth,
      crossModelConsistency,
      modelScores,
      dataPoints: totalDataPoints,
      confidence,
    };

    results.push(result);

    if (!dryRun) {
      await prisma.aasScore.create({
        data: {
          toolId,
          categoryId,
          aas,
          unpromptedPickRate: needRate,
          ecosystemPickRate: ecoRate,
          considerationRate: considRate,
          contextBreadth,
          crossModelConsistency,
          expertPreference: null,
          hiddenGemGap: null,
          hiddenGemClass: null,
          modelScores,
          dataPoints: totalDataPoints,
          confidence,
        },
      });
    }
  }

  // Print summary
  results.sort((a, b) => b.aas - a.aas);

  console.log('\n' + 'TOOL'.padEnd(22) + 'CATEGORY'.padEnd(18) + 'AAS'.padEnd(6) + 'PICK%'.padEnd(8) + 'ECO%'.padEnd(8) + 'CONSID%'.padEnd(9) + 'BREADTH'.padEnd(9) + 'MODELS'.padEnd(9) + 'PTS');
  console.log('-'.repeat(100));

  for (const r of results) {
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

  return results;
}
