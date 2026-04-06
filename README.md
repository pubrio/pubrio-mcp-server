# pubrio-mcp-server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [Pubrio](https://pubrio.com) — the glocalized business data layer for AI agents and revenue teams. Search the whole market — not just the 30% in mainstream datasets.

Give your AI agents access to companies, people, jobs, news, ads, and intent signals from around the globe.

## Installation

```bash
npm install -g pubrio-mcp-server
```

## Configuration

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "pubrio": {
      "command": "pubrio-mcp-server",
      "env": {
        "PUBRIO_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add pubrio pubrio-mcp-server -e PUBRIO_API_KEY=your-api-key-here
```

### Cursor / Windsurf / Other MCP Clients

Any MCP-compatible client can use this server. Set the command to `pubrio-mcp-server` and pass `PUBRIO_API_KEY` as an environment variable.

## Available Tools (17)

### Company Tools

| Tool | Description |
|------|-------------|
| `search_companies` | Search companies by name, domain, location, industry, technology, headcount, revenue, keywords, and more |
| `lookup_company` | Look up a company by domain, LinkedIn URL, or domain_search_id |
| `enrich_company` | Enrich company with full firmographic data including contacts (uses credits) |

### People Tools

| Tool | Description |
|------|-------------|
| `search_people` | Search people by name, title, department, seniority, location, company, and more |
| `lookup_person` | Look up a person by LinkedIn URL or people_search_id |
| `lookup_person_linkedin` | Real-time LinkedIn person lookup using people_linkedin_url |
| `enrich_person` | Enrich person with full professional details (uses credits) |
| `reveal_contact` | Reveal email (work/personal) or phone for a person (uses credits) |

### Signal Tools

| Tool | Description |
|------|-------------|
| `search_jobs` | Search job postings across companies by title, location, keyword, and date |
| `search_news` | Search company news and press releases by category, language, gallery, and date |
| `search_ads` | Search company advertisements by keyword, headline, target location, and date range |
| `find_similar_companies` | Find lookalike companies with filters for location, industry, technology, headcount, and more |
| `lookup_technology` | Look up technologies used by a company (by domain, LinkedIn URL, domain_search_id, or domain_id) |

### Utility Tools

| Tool | Description |
|------|-------------|
| `get_usage` | Get credit usage and subscription information |
| `get_user` | Get current authenticated user details |
| `validate_webhook` | Test a webhook destination configuration |
| `get_monitor_chart` | Get daily trigger statistics for a monitor over a date range |

## Example Prompts

Once configured, you can ask Claude things like:

- "Search for SaaS companies in Singapore with 50-200 employees"
- "Look up the company stripe.com and tell me about their tech stack"
- "Find VP of Engineering at companies using React in San Francisco"
- "What job postings does Notion have right now?"
- "Find companies similar to Figma in Europe"
- "Search for recent news about AI startups"
- "What ads is Shopify running targeting the US?"
- "Reveal the work email for this LinkedIn profile: https://linkedin.com/in/..."

## Example Use Cases

- **Account research**: Ask Claude to research a prospect company — firmographics, tech stack, recent news, job postings, and key decision-makers — all in one conversation
- **Lead generation**: Search for companies matching your ICP, find decision-makers, and reveal their contact details
- **Competitive intelligence**: Monitor competitor job postings, news, and advertisements for strategic insights
- **Market mapping**: Find all companies in a vertical, region, or technology category and analyze the landscape
- **Signal-based selling**: Search for companies with specific hiring patterns or news events that indicate buying intent

## Authentication

Get your API key from [dashboard.pubrio.com](https://dashboard.pubrio.com) under Settings.

## Rate Limits

- 1,200 requests/minute global
- Plan-based hourly limits: Free (60/hr), Growth (2,400/hr), Business (12,000/hr)

## Resources

- [Pubrio API Documentation](https://docs.pubrio.com/en/api-reference/introduction)
- [Pubrio Dashboard](https://dashboard.pubrio.com)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

## License

MIT
