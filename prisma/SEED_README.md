# SurvivalIndex Seed Data Documentation

## Overview

This directory contains seed data and tools for populating the SurvivalIndex database with projects.

## Files

- **`seed.js`** - Initial seed file with 50 well-documented projects across 10 categories
- **`add-projects-template.js`** - Template and script for incrementally adding new projects
- **`SEED_README.md`** - This documentation file

## Initial Seed (50 Projects)

The initial seed includes 50 carefully curated projects across these categories:

1. **Databases & Data Storage** (5) - PostgreSQL, Redis, MongoDB, Supabase, ClickHouse
2. **Web Frameworks & Libraries** (5) - React, Next.js, Svelte, Tailwind CSS, Astro
3. **Backend & API Frameworks** (5) - Express, FastAPI, NestJS, tRPC, Hono
4. **DevOps & Infrastructure** (5) - Docker, Kubernetes, Terraform, Nginx, Prometheus
5. **AI & Machine Learning** (5) - PyTorch, Ollama, LangChain, Hugging Face, Stable Diffusion
6. **Collaboration & Productivity** (5) - Notion, Obsidian, Mattermost, Linear, Excalidraw
7. **Developer Tools** (5) - VS Code, Git, Postman, Prettier, Vite
8. **Security & Authentication** (5) - Keycloak, Bitwarden, Vault, Authelia, OWASP ZAP
9. **Content Management** (5) - WordPress, Strapi, Ghost, Payload CMS, Sanity
10. **Communication & Messaging** (5) - Slack, Discord, Matrix, Rocket.Chat, Zulip
11. **Design & Creative Tools** (5) - Figma, Penpot, Blender, GIMP, Canva

### Running the Initial Seed

```bash
# From the project root
cd apps/backend
npm run seed

# Or directly
node prisma/seed.js
```

## Adding More Projects

### Quick Start

1. Open `add-projects-template.js`
2. Add your projects to the `newProjects` array
3. Run the script:

```bash
node apps/backend/prisma/add-projects-template.js
```

### Project Template

```javascript
{
  name: 'Project Name',              // Required: Unique name
  type: 'open-source',               // Required: 'open-source' | 'saas' | 'hybrid'
  category: 'Developer Tools',       // Required: See categories below
  description: 'Clear description',  // Required: What does it do?
  url: 'https://example.com',        // Optional: Official website
  githubUrl: 'https://github.com/...', // Optional: GitHub repo (null for SaaS)
  logo: '🚀',                        // Optional: Emoji or image URL
  tags: 'tag1,tag2,tag3',           // Optional: Comma-separated
  yearCreated: 2024,                 // Optional: Year started
  selfHostable: true,                // Required: Can it be self-hosted?
  license: 'MIT',                    // Optional: License type
  techStack: 'TypeScript,React',     // Optional: Comma-separated
  alternativeTo: 'Alt1,Alt2'        // Optional: Comma-separated alternatives
}
```

## Available Categories

The following 25+ categories are available:

### Core Infrastructure
- Databases & Data Storage
- DevOps & Infrastructure
- Cloud & Hosting
- Networking & Protocols

### Development
- Web Frameworks & Libraries
- Backend & API Frameworks
- Mobile Development
- Developer Tools
- Testing & QA

### AI & Data
- AI & Machine Learning
- Data Science & Analytics
- Analytics & Monitoring

### Business & Productivity
- Collaboration & Productivity
- Communication & Messaging
- Content Management
- E-commerce & Payments
- Finance & Accounting

### Creative & Media
- Design & Creative Tools
- Audio & Video
- Gaming & Graphics

### Security & Specialized
- Security & Authentication
- Blockchain & Web3
- IoT & Embedded Systems

### Domain-Specific
- Education & Learning
- Healthcare & Medical

## Field Guidelines

### Required Fields
- `name` - Must be unique across all projects
- `type` - Choose the most appropriate:
  - `open-source`: Fully open-source projects
  - `saas`: Proprietary cloud services
  - `hybrid`: Open-source with paid cloud offering
- `category` - Must match one from the list above
- `description` - Clear, concise (aim for 1-2 sentences)
- `selfHostable` - Boolean indicating if it can be self-hosted

### Optional But Recommended
- `url` - Official website (highly recommended)
- `githubUrl` - GitHub repository (for open-source projects)
- `logo` - Single emoji that represents the project
- `tags` - 3-5 relevant keywords
- `license` - Specific license (e.g., MIT, Apache-2.0, GPL-3.0, Proprietary)
- `techStack` - Main technologies used
- `alternativeTo` - Competing or similar products

### Common Licenses
- **Open Source**: MIT, Apache-2.0, GPL-3.0, BSD-3-Clause, MPL-2.0
- **Proprietary**: Proprietary, SSPL, Custom
- **Creative**: CreativeML Open RAIL-M, CC-BY-4.0

## Examples

### Open-Source Database
```javascript
{
  name: 'CockroachDB',
  type: 'open-source',
  category: 'Databases & Data Storage',
  description: 'Distributed SQL database with horizontal scalability and strong consistency',
  url: 'https://www.cockroachlabs.com',
  githubUrl: 'https://github.com/cockroachdb/cockroach',
  logo: '🪳',
  tags: 'database,distributed,sql,scalability',
  yearCreated: 2015,
  selfHostable: true,
  license: 'Apache-2.0',
  techStack: 'Go,SQL',
  alternativeTo: 'PostgreSQL,Google Spanner,YugabyteDB'
}
```

### SaaS Product
```javascript
{
  name: 'Vercel',
  type: 'saas',
  category: 'Cloud & Hosting',
  description: 'Cloud platform for frontend frameworks with instant deployments and serverless functions',
  url: 'https://vercel.com',
  githubUrl: null,
  logo: '▲',
  tags: 'hosting,deployment,serverless,frontend',
  yearCreated: 2015,
  selfHostable: false,
  license: 'Proprietary',
  techStack: 'Node.js,Edge Runtime',
  alternativeTo: 'Netlify,Cloudflare Pages,AWS Amplify'
}
```

### Hybrid Project
```javascript
{
  name: 'GitLab',
  type: 'hybrid',
  category: 'Developer Tools',
  description: 'Complete DevOps platform with Git repository management, CI/CD, and project planning',
  url: 'https://gitlab.com',
  githubUrl: 'https://gitlab.com/gitlab-org/gitlab',
  logo: '🦊',
  tags: 'git,devops,ci-cd,repository',
  yearCreated: 2011,
  selfHostable: true,
  license: 'MIT',
  techStack: 'Ruby,Go,Vue.js,PostgreSQL',
  alternativeTo: 'GitHub,Bitbucket,Gitea'
}
```

## Validation

The `add-projects-template.js` script includes automatic validation:

- ✅ Checks all required fields are present
- ✅ Validates `type` is one of: open-source, saas, hybrid
- ✅ Validates `category` matches available categories
- ✅ Checks for duplicate project names
- ✅ Ensures `selfHostable` is boolean

## Tips for Adding Projects

1. **Research thoroughly** - Ensure accuracy of all fields
2. **Be consistent** - Follow existing naming conventions
3. **Use emojis wisely** - Pick one that clearly represents the project
4. **Keep descriptions concise** - Focus on the core value proposition
5. **Tag appropriately** - Use 3-5 relevant, searchable keywords
6. **Specify alternatives** - List 2-4 direct competitors or alternatives
7. **Tech stack** - List primary technologies, not every dependency

## Database Schema

Projects are stored with these fields:

```prisma
model Project {
  id            Int      @id @default(autoincrement())
  name          String   @unique
  type          String   // 'open-source' | 'saas' | 'hybrid'
  category      String
  description   String
  url           String?
  githubUrl     String?
  logo          String?
  tags          String?  // comma-separated
  yearCreated   Int?
  selfHostable  Boolean  @default(false)
  license       String?
  techStack     String?  // comma-separated
  alternativeTo String?  // comma-separated
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Roadmap

Future enhancements to seed data:

- [ ] Add remaining 15 categories with projects
- [ ] Expand to 150+ total projects
- [ ] Add GitHub stars/metrics fetching
- [ ] Create category-specific seed files
- [ ] Add bulk import from CSV/JSON
- [ ] Create web UI for adding projects

## Contributing

When adding projects, ensure they:

1. Are actively maintained (or historically significant)
2. Have clear documentation
3. Serve a real-world use case
4. Are not duplicates of existing entries
5. Fit clearly into one of the defined categories

## Support

For questions or issues with seeding:

1. Check this README first
2. Review existing projects in `seed.js` for examples
3. Validate your data using the template script
4. Check the console output for specific error messages
