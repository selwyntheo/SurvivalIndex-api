# 📊 SurvivalIndex Data Export

This directory contains JSONL (JSON Lines) exports of all assessed projects and their ratings, enabling community transparency and contributions.

## 📁 File Structure

```
data/
├── projects.jsonl          # All projects with metadata
├── ai-ratings.jsonl        # AI-generated survival ratings
├── community-ratings.jsonl # Community-submitted ratings
└── submissions.jsonl       # Pending project submissions
```

## 📝 Format

Each file contains one JSON object per line (JSONL format).

### projects.jsonl

```jsonl
{"id":1,"name":"PostgreSQL","type":"open-source","category":"Database","description":"Advanced open source relational database","url":"https://postgresql.org","githubUrl":"https://github.com/postgres/postgres","logo":"🐘","tags":"sql,acid,enterprise","yearCreated":1996,"selfHostable":true,"license":"PostgreSQL","techStack":"C,SQL","alternativeTo":"MySQL,Oracle","createdAt":"2026-02-09T12:00:00.000Z","updatedAt":"2026-02-09T12:00:00.000Z"}
```

### ai-ratings.jsonl

```jsonl
{"id":1,"projectId":1,"projectName":"PostgreSQL","insightCompression":9.2,"substrateEfficiency":9.5,"broadUtility":9.8,"awareness":9.7,"agentFriction":2.2,"humanCoefficient":8.5,"survivalScore":9.1,"tier":"S","confidence":0.92,"model":"claude-sonnet-4-5","githubStars":15000,"githubForks":3500,"lastAnalyzedAt":"2026-02-09T12:00:00.000Z"}
```

### community-ratings.jsonl

```jsonl
{"id":1,"projectId":1,"projectName":"PostgreSQL","insightCompression":9.0,"substrateEfficiency":9.0,"broadUtility":10.0,"awareness":9.5,"agentFriction":3.0,"humanCoefficient":8.0,"userId":"user123","createdAt":"2026-02-09T12:00:00.000Z"}
```

## 🔄 Update Frequency

Data exports are automatically updated:
- **On every AI evaluation** - New ratings added immediately
- **Daily at 00:00 UTC** - Full export refresh via GitHub Actions
- **On manual trigger** - Via API endpoint `/api/export/generate`

## 🤝 Community Contributions

### How to Contribute

1. **Fork the repository**
2. **Add new projects** to `data/submissions.jsonl`:
   ```jsonl
   {"name":"YourProject","type":"open-source","category":"Database","description":"Amazing project","url":"https://example.com","githubUrl":"https://github.com/user/project","tags":"tag1,tag2","yearCreated":2024}
   ```
3. **Submit a Pull Request**
4. **Admin reviews** and approves/rejects

### Submission Format

Required fields:
- `name` - Project name
- `type` - "open-source", "saas", or "hybrid"
- `category` - Category (e.g., "Database", "Web Server")
- `description` - Brief description
- `url` - Project website

Optional fields:
- `githubUrl` - GitHub repository URL
- `logo` - Emoji or image URL
- `tags` - Comma-separated tags
- `yearCreated` - Year project was created
- `selfHostable` - Boolean
- `license` - License type
- `techStack` - Comma-separated tech stack
- `alternativeTo` - Comma-separated alternatives

## 📊 Data Analysis

Use these files for:
- **Research** - Analyze survival patterns
- **Visualization** - Create charts and graphs
- **Machine Learning** - Train models on survival data
- **Community Tools** - Build alternative frontends
- **Data Science** - Statistical analysis

## 🔗 API Access

Programmatic access:
```bash
# Get all projects
curl https://api.survivalindex.org/api/export/projects

# Get AI ratings
curl https://api.survivalindex.org/api/export/ai-ratings

# Get community ratings
curl https://api.survivalindex.org/api/export/community-ratings
```

## 📜 License

This data is released under **CC BY 4.0** (Creative Commons Attribution 4.0 International).

You are free to:
- **Share** - Copy and redistribute the data
- **Adapt** - Transform and build upon the data

Under the following terms:
- **Attribution** - Give appropriate credit to SurvivalIndex.org

## 🙏 Credits

- **Framework**: Based on Steve Yegge's "Software Survival 3.0"
- **AI Evaluation**: Powered by Anthropic Claude
- **Community**: Contributions from developers worldwide
