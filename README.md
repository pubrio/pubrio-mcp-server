# pubrio-mcp-server

[![Glama MCP Server Score](https://glama.ai/mcp/servers/pubrio/pubrio-mcp-server/badges/score.svg)](https://glama.ai/mcp/servers/pubrio/pubrio-mcp-server)

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

## Available Tools (51)

### Company Tools (6)

| Tool | Description |
|------|-------------|
| `search_companies` | Search companies by name, domain, location, industry, technology, headcount, and more |
| `lookup_company` | Look up a company by domain, LinkedIn URL, or domain_search_id |
| `lookup_company_linkedin` | Look up a company by its LinkedIn URL using the dedicated LinkedIn endpoint |
| `enrich_company` | Enrich company with full firmographic data (uses credits) |
| `find_similar_companies` | Find lookalike companies with filters for location, industry, technology, headcount, and more |
| `lookup_technology` | Look up technologies used by a company |

### Signal Tools (7)

| Tool | Description |
|------|-------------|
| `search_jobs` | Search job postings across companies by title, location, keyword, and date |
| `lookup_job` | Look up detailed information about a specific job posting |
| `search_news` | Search company news and press releases by category, language, gallery, and date |
| `lookup_news` | Look up detailed information about a specific news article |
| `search_ads` | Search company advertisements by keyword, headline, target location, and date range |
| `lookup_advertisement` | Look up detailed information about a specific advertisement |
| `lookup_lookalike` | Look up a similar/lookalike company result |

### People Tools (7)

| Tool | Description |
|------|-------------|
| `search_people` | Search people by name, title, department, seniority, location, company, and more |
| `lookup_person` | Look up a person by LinkedIn URL or people_search_id |
| `lookup_person_linkedin` | Real-time LinkedIn person lookup using people_linkedin_url |
| `enrich_person` | Enrich person with full professional details (uses credits) |
| `reveal_contact` | Reveal email (work/personal) or phone for a person (uses credits) |
| `batch_redeem_contacts` | Reveal contact details for multiple people at once (uses credits) |
| `query_batch_redeem` | Check the status and results of a batch contact redeem operation |

### Filter / Reference Data Tools (14)

| Tool | Description |
|------|-------------|
| `get_locations` | Get all available location codes for search filters |
| `get_departments` | Get all department title codes for people search filters |
| `get_department_functions` | Get all department function codes for people search filters |
| `get_management_levels` | Get all management/seniority level codes for people search filters |
| `get_company_sizes` | Get all company size range codes for search filters |
| `get_timezones` | Get all available timezone codes |
| `get_news_categories` | Get all news category codes for news search filters |
| `get_news_galleries` | Get all news gallery codes for news search filters |
| `get_news_languages` | Get all news language codes for news search filters |
| `search_technologies` | Search for technology names by keyword |
| `search_technology_categories` | Search for technology category names by keyword |
| `search_verticals` | Search for industry vertical names by keyword |
| `search_vertical_categories` | Search for vertical category names by keyword |
| `search_vertical_sub_categories` | Search for vertical sub-category names by keyword |

### Monitor Tools (14)

| Tool | Description |
|------|-------------|
| `create_monitor` | Create a new signal monitor for jobs, news, or advertisements |
| `update_monitor` | Update an existing signal monitor configuration |
| `get_monitor` | Get detailed information about a specific monitor |
| `list_monitors` | List all signal monitors with pagination and sorting |
| `delete_monitor` | Permanently delete a signal monitor |
| `duplicate_monitor` | Create a copy of an existing monitor |
| `test_run_monitor` | Execute a test run of a monitor to preview triggers |
| `retry_monitor` | Retry a failed monitor trigger by log ID |
| `validate_webhook` | Test a webhook destination configuration |
| `get_monitor_stats` | Get aggregate statistics across all monitors |
| `get_monitor_chart` | Get daily trigger statistics for a monitor over a date range |
| `get_monitor_logs` | Get trigger logs for a specific monitor |
| `lookup_monitor_log` | Look up detailed information about a specific monitor trigger log entry |
| `reveal_monitor_signature` | Reveal the webhook signature secret for a monitor |

### Profile / Utility Tools (3)

| Tool | Description |
|------|-------------|
| `get_profile` | Get full profile information for the authenticated account |
| `get_usage` | Get credit usage and subscription information |
| `get_user` | Get current authenticated user details |

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
- "Create a monitor to track new job postings from my target accounts"
- "Show me all available location codes for filtering"

## Example Use Cases

- **Account research**: Ask Claude to research a prospect company — firmographics, tech stack, recent news, job postings, and key decision-makers — all in one conversation
- **Lead generation**: Search for companies matching your ICP, find decision-makers, and reveal their contact details
- **Competitive intelligence**: Monitor competitor job postings, news, and advertisements for strategic insights
- **Market mapping**: Find all companies in a vertical, region, or technology category and analyze the landscape
- **Signal-based selling**: Search for companies with specific hiring patterns or news events that indicate buying intent
- **Automated monitoring**: Set up monitors to get alerted when target companies post new jobs, appear in news, or launch ad campaigns

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
