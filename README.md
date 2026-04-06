# pubrio-mcp-server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [Pubrio](https://pubrio.com) — the glocalized business data layer for AI agents. Search the whole market — not just the 30% of well-known companies in mainstream datasets.

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

## Available Tools

| Tool | Description |
|------|-------------|
| `search_companies` | Search companies by name, domain, location, industry, technology, headcount |
| `lookup_company` | Look up a company by domain or LinkedIn URL |
| `enrich_company` | Enrich company with full firmographic data (uses credits) |
| `search_people` | Search people by name, title, department, seniority, company |
| `lookup_person` | Look up a person by LinkedIn URL |
| `enrich_person` | Enrich person with full professional details (uses credits) |
| `reveal_contact` | Reveal email or phone for a person (uses credits) |
| `search_jobs` | Search job postings across companies |
| `search_news` | Search company news and press releases |
| `find_similar_companies` | Find companies similar to a given company |
| `lookup_technology` | Look up technologies used by a company |
| `get_usage` | Get credit usage and subscription info |
| `get_user` | Get current authenticated user details |
| `validate_webhook` | Test a webhook destination configuration |
| `get_monitor_chart` | Get daily trigger statistics over a date range |

## Example Prompts

Once configured, you can ask Claude things like:

- "Search for SaaS companies in San Francisco with 50-200 employees"
- "Look up the company google.com and tell me about their tech stack"
- "Find people with the title VP of Engineering at companies using React"
- "What job postings does Stripe have right now?"
- "Find companies similar to Notion"

## Authentication

Get your API key from [dashboard.pubrio.com](https://dashboard.pubrio.com) under Settings.

## License

MIT
