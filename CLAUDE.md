# CLAUDE.md

## Overview
Pubrio MCP server -- single-file TypeScript server exposing Pubrio B2B data APIs as MCP tools.

## Architecture
- `src/index.ts` -- all tools in one file
- Uses `@modelcontextprotocol/sdk` McpServer with StdioServerTransport
- Zod 4.x for parameter validation
- `pubrioRequest()` helper handles all HTTP calls to `https://api.pubrio.com`
- `splitComma()` converts comma-separated string params to arrays

## Build & Run
- `npm run build` -- compiles TypeScript
- `npm start` -- runs compiled server
- Requires `PUBRIO_API_KEY` env var

## Conventions
- Every tool follows the same pattern: `server.tool(name, description, zodSchema, asyncHandler)`
- Comma-separated string params (not arrays) for MCP compatibility
- All handlers return `{ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }`
- Optional params use `if (params.x) body.x = params.x` pattern
- Numeric optional params use `if (params.x != null)` to handle zero values

## Tool Categories
- Companies (6): search, lookup, enrich, similar, linkedin lookup, technology
- People (7): search, lookup, linkedin lookup, enrich, reveal, batch redeem, query batch
- Signals (7): jobs search/lookup, news search/lookup, ads search/lookup, lookalike lookup
- Reference Data (14): locations, departments, management levels, company sizes, timezones, news categories/galleries/languages, technologies, verticals
- Monitors (14): CRUD, duplicate, test run, retry, validate webhook, stats, chart, logs, log lookup, signature
- Profile (3): profile, usage, user
