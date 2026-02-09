import Anthropic from '@anthropic-ai/sdk';
import { Octokit } from 'octokit';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const octokit = process.env.GITHUB_TOKEN ? new Octokit({
  auth: process.env.GITHUB_TOKEN
}) : null;

/**
 * AI Judge Agent for SurvivalIndex
 * Uses Claude to evaluate software projects across 6 survival levers
 */
class AIJudge {
  constructor() {
    this.model = 'claude-sonnet-4-5-20250929';
    this.weights = {
      insightCompression: 0.20,    // 20%
      substrateEfficiency: 0.18,   // 18%
      broadUtility: 0.22,          // 22%
      awareness: 0.15,             // 15%
      agentFriction: 0.15,         // 15%
      humanCoefficient: 0.10       // 10%
    };
  }

  /**
   * Main evaluation function - orchestrates the entire scoring process
   */
  async evaluateProject(projectData) {
    console.log(`🤖 AI Judge: Evaluating project "${projectData.name}"...`);

    try {
      // Step 1: Gather additional data
      const githubData = projectData.githubUrl
        ? await this.analyzeGitHub(projectData.githubUrl)
        : null;

      // Step 2: Use Claude to score all 6 levers
      const leverScores = await this.scoreLeverswithLLM({
        ...projectData,
        githubData
      });

      // Step 3: Calculate weighted survival score
      const survivalScore = this.calculateWeightedScore(leverScores.scores);
      const tier = this.calculateTier(survivalScore);

      // Step 4: Return comprehensive results
      return {
        scores: leverScores.scores,
        survivalScore: parseFloat(survivalScore.toFixed(2)),
        tier,
        confidence: leverScores.confidence,
        reasoning: leverScores.reasoning,
        model: this.model,
        githubData,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI Judge evaluation failed:', error);
      throw new Error(`AI Judge evaluation failed: ${error.message}`);
    }
  }

  /**
   * Fetch and analyze GitHub repository data
   */
  async analyzeGitHub(githubUrl) {
    if (!octokit) {
      console.warn('⚠️  No GitHub token provided, skipping GitHub analysis');
      return null;
    }

    try {
      // Parse GitHub URL to get owner and repo
      const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        console.warn('Invalid GitHub URL format');
        return null;
      }

      const [, owner, repo] = match;

      // Fetch repository data
      const { data: repoData } = await octokit.rest.repos.get({
        owner,
        repo: repo.replace(/\.git$/, '')
      });

      // Fetch recent activity (commits in last 90 days)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

      const { data: commits } = await octokit.rest.repos.listCommits({
        owner,
        repo: repo.replace(/\.git$/, ''),
        since: threeMonthsAgo.toISOString(),
        per_page: 100
      });

      return {
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        watchers: repoData.watchers_count,
        language: repoData.language,
        size: repoData.size,
        hasWiki: repoData.has_wiki,
        hasPages: repoData.has_pages,
        topics: repoData.topics || [],
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at,
        license: repoData.license?.name,
        description: repoData.description,
        recentCommitsCount: commits.length,
        isActive: commits.length > 10, // Active if 10+ commits in 90 days
      };
    } catch (error) {
      console.error('GitHub analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Use Claude to score all 6 survival levers
   */
  async scoreLeverswithLLM(projectData) {
    // Demo mode: Use mock scores if API key is "demo_mode"
    if (process.env.ANTHROPIC_API_KEY === 'demo_mode') {
      console.log('🎭 Running in DEMO MODE - using simulated AI scores');
      return this.generateDemoScores(projectData);
    }

    const prompt = this.buildScoringPrompt(projectData);

    try {
      const message = await anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Parse Claude's response
      const responseText = message.content[0].text;
      return this.parseClaudeResponse(responseText);
    } catch (error) {
      console.error('Claude API call failed:', error);
      throw error;
    }
  }

  /**
   * Generate demo scores for testing (used when ANTHROPIC_API_KEY = "demo_mode")
   */
  generateDemoScores(projectData) {
    const { name, type, category, yearCreated, githubData } = projectData;

    // Base scores influenced by project characteristics
    let insightCompression = 7.0 + Math.random() * 2;
    let substrateEfficiency = 7.5 + Math.random() * 2;
    let broadUtility = 7.0 + Math.random() * 2.5;
    let awareness = 6.5 + Math.random() * 2.5;
    let agentFriction = 7.0 + Math.random() * 2;
    let humanCoefficient = 6.5 + Math.random() * 2.5;

    // Boost scores for well-known projects
    const famousProjects = ['PostgreSQL', 'Git', 'Redis', 'Docker', 'Kubernetes', 'SQLite'];
    if (famousProjects.includes(name)) {
      insightCompression += 1.5;
      awareness += 2.0;
      broadUtility += 1.5;
    }

    // Boost for old, established projects
    if (yearCreated && yearCreated < 2010) {
      insightCompression += 1.0;
      humanCoefficient += 1.0;
    }

    // Boost for open source
    if (type === 'open-source') {
      awareness += 0.5;
      agentFriction += 0.5;
    }

    // Boost based on GitHub stars
    if (githubData && githubData.stars > 10000) {
      awareness += 1.0;
    }

    // Cap at 10
    const scores = {
      insightCompression: Math.min(10, parseFloat(insightCompression.toFixed(1))),
      substrateEfficiency: Math.min(10, parseFloat(substrateEfficiency.toFixed(1))),
      broadUtility: Math.min(10, parseFloat(broadUtility.toFixed(1))),
      awareness: Math.min(10, parseFloat(awareness.toFixed(1))),
      agentFriction: Math.min(10, parseFloat(agentFriction.toFixed(1))),
      humanCoefficient: Math.min(10, parseFloat(humanCoefficient.toFixed(1)))
    };

    // Find lowest scoring levers for targeted suggestions
    const leverScores = Object.entries(scores).sort((a, b) => a[1] - b[1]);
    const lowestLever = leverScores[0][0];
    const secondLowest = leverScores[1][0];

    return {
      scores,
      confidence: 0.85 + Math.random() * 0.10,
      reasoning: {
        insightCompression: `${name} demonstrates strong crystallized knowledge in ${category}. Score: ${scores.insightCompression}/10`,
        substrateEfficiency: `Runs efficiently on standard hardware with good performance characteristics. Score: ${scores.substrateEfficiency}/10`,
        broadUtility: `Cross-domain applicability in ${category} use cases. Score: ${scores.broadUtility}/10`,
        awareness: `Well-known in the ${category} space${githubData ? ` with ${githubData.stars} GitHub stars` : ''}. Score: ${scores.awareness}/10`,
        agentFriction: `${type === 'open-source' ? 'Open source with good' : 'Commercial with decent'} API/programmatic access. Score: ${scores.agentFriction}/10`,
        humanCoefficient: `Developers ${yearCreated && yearCreated < 2010 ? 'have long trusted' : 'appreciate'} this tool. Score: ${scores.humanCoefficient}/10`,
        overall: `${name} shows strong survival characteristics as a ${category} solution. ${yearCreated ? `Established in ${yearCreated}.` : ''} Predicted to remain relevant in the AI era.`
      },
      suggestions: {
        topPriorities: [
          `Improve ${lowestLever.replace(/([A-Z])/g, ' $1').toLowerCase()} - this is currently the weakest lever at ${scores[lowestLever]}/10.`,
          `Focus on ${secondLowest.replace(/([A-Z])/g, ' $1').toLowerCase()} to boost overall survival score.`,
          `Maintain strengths in top-performing areas while addressing vulnerabilities.`
        ],
        quickWins: [
          `Increase community engagement through documentation and tutorials.`,
          `Create more examples and use cases to demonstrate value.`
        ],
        longTerm: [
          `Build strategic partnerships to increase awareness and adoption.`,
          `Invest in API design and developer experience for better agent integration.`
        ]
      }
    };
  }

  /**
   * Build comprehensive prompt for Claude
   */
  buildScoringPrompt(projectData) {
    const { name, description, type, category, url, githubUrl, githubData, tags, yearCreated } = projectData;

    return `You are an AI Judge for SurvivalIndex.org, a platform that rates software's likelihood of survival in the AI era.

Your task is to evaluate the software project "${name}" across 6 critical survival levers and provide scores from 0-10 for each.

## PROJECT INFORMATION

**Name:** ${name}
**Type:** ${type}
**Category:** ${category}
**Description:** ${description}
**Website:** ${url || 'N/A'}
**GitHub:** ${githubUrl || 'N/A'}
**Tags:** ${tags || 'N/A'}
**Year Created:** ${yearCreated || 'Unknown'}

${githubData ? `
## GITHUB METRICS

- **Stars:** ${githubData.stars.toLocaleString()}
- **Forks:** ${githubData.forks.toLocaleString()}
- **Open Issues:** ${githubData.openIssues}
- **Language:** ${githubData.language || 'N/A'}
- **License:** ${githubData.license || 'None'}
- **Recent Activity:** ${githubData.recentCommitsCount} commits in last 90 days
- **Active Development:** ${githubData.isActive ? 'Yes' : 'No'}
- **Topics:** ${githubData.topics?.join(', ') || 'None'}
` : ''}

## THE 6 SURVIVAL LEVERS

Evaluate each lever on a scale of 0-10:

### 1. Insight Compression (Weight: 20%)
**Definition:** The density of crystallized, hard-won knowledge encoded in the software.
- How much deep, specialized knowledge is embedded?
- Is this knowledge difficult to recreate?
- Does it capture years of domain expertise?
**Examples:** PostgreSQL (9.5), Git (9.2), Redis (8.8)

### 2. Substrate Efficiency (Weight: 18%)
**Definition:** How efficiently it runs on commodity hardware vs. requiring specialized resources.
- CPU-friendly = higher score
- GPU-dependent = lower score
- Consider memory, storage, and compute requirements
**Examples:** SQLite (9.8), VS Code (8.5), TensorFlow (5.2)

### 3. Broad Utility (Weight: 22%)
**Definition:** Cross-domain applicability and versatility.
- Can it be used across multiple industries/use-cases?
- Is it a general-purpose tool or niche-specific?
- Does it solve fundamental vs. specialized problems?
**Examples:** Python (9.7), PostgreSQL (9.5), Stripe (8.9)

### 4. Awareness/Publicity (Weight: 15%)
**Definition:** Discoverability and mindshare in the developer ecosystem.
- GitHub stars, community size, brand recognition
- Documentation quality and accessibility
- Presence in tutorials, courses, and discussions
**Examples:** React (9.8), Docker (9.5), Tailwind (8.7)

### 5. Agent Friction (Weight: 15%)
**Definition:** How easy it is for AI agents to use/integrate (LOWER is better, but score HIGH for low friction).
- API quality: RESTful, well-documented, consistent
- Programmatic access: SDKs, clear interfaces
- Complexity: Simple = high score, complex UI-dependent = low score
**Scoring:** Low friction (easy for agents) = HIGH score (8-10), High friction = LOW score (2-4)
**Examples:** Stripe (9.5), PostgreSQL (9.0), Photoshop (3.5)

### 6. Human Coefficient (Weight: 10%)
**Definition:** Enduring human preference and irreplaceable human value.
- Do humans *prefer* this over alternatives?
- Does it match human cognitive models/workflows?
- Is there emotional attachment or brand loyalty?
**Examples:** Git (9.0), Notion (8.5), Figma (8.8)

## OUTPUT FORMAT

Respond ONLY with valid JSON in this exact format:

\`\`\`json
{
  "scores": {
    "insightCompression": 8.5,
    "substrateEfficiency": 7.2,
    "broadUtility": 9.0,
    "awareness": 8.8,
    "agentFriction": 7.5,
    "humanCoefficient": 8.0
  },
  "confidence": 0.85,
  "reasoning": {
    "insightCompression": "Brief explanation of score...",
    "substrateEfficiency": "Brief explanation of score...",
    "broadUtility": "Brief explanation of score...",
    "awareness": "Brief explanation of score...",
    "agentFriction": "Brief explanation of score...",
    "humanCoefficient": "Brief explanation of score...",
    "overall": "Overall survival assessment in 2-3 sentences..."
  },
  "suggestions": {
    "topPriorities": [
      "Most critical improvement needed (1-2 sentences)",
      "Second most important action (1-2 sentences)",
      "Third priority improvement (1-2 sentences)"
    ],
    "quickWins": [
      "Easy improvement that could boost score (1 sentence)",
      "Another quick win (1 sentence)"
    ],
    "longTerm": [
      "Strategic improvement for long-term survival (1-2 sentences)",
      "Another long-term recommendation (1-2 sentences)"
    ]
  }
}
\`\`\`

**IMPORTANT:**
- Scores must be numbers between 0 and 10 (can include decimals)
- Confidence must be between 0 and 1
- Be critical and realistic - not everything deserves 8+
- Consider both current state and future AI landscape
- Reasoning should be concise but insightful
- Suggestions should be specific, actionable, and prioritized by impact
- Focus suggestions on the lowest-scoring levers that would have the biggest impact`;
  }

  /**
   * Parse Claude's JSON response
   */
  parseClaudeResponse(responseText) {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                       responseText.match(/```\n([\s\S]*?)\n```/);

      const jsonString = jsonMatch ? jsonMatch[1] : responseText;
      const parsed = JSON.parse(jsonString.trim());

      // Validate structure
      if (!parsed.scores || !parsed.confidence || !parsed.reasoning) {
        throw new Error('Invalid response structure from Claude');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      console.error('Response text:', responseText);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Calculate weighted survival score
   */
  calculateWeightedScore(scores) {
    const weightedSum =
      scores.insightCompression * this.weights.insightCompression +
      scores.substrateEfficiency * this.weights.substrateEfficiency +
      scores.broadUtility * this.weights.broadUtility +
      scores.awareness * this.weights.awareness +
      scores.agentFriction * this.weights.agentFriction +
      scores.humanCoefficient * this.weights.humanCoefficient;

    return weightedSum;
  }

  /**
   * Calculate survival tier
   */
  calculateTier(score) {
    if (score >= 9.0) return 'S';
    if (score >= 8.0) return 'A';
    if (score >= 7.0) return 'B';
    if (score >= 6.0) return 'C';
    if (score >= 5.0) return 'D';
    return 'F';
  }
}

export default new AIJudge();
