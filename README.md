# @pipeworx/gov-uk-content

[GOV.UK Content API](https://content-api.publishing.service.gov.uk/) MCP — the rendered content + metadata behind every page on gov.uk. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `content(base_path)` — content for a gov.uk page (e.g. `/jobsearch`, `/government/organisations/cabinet-office`)
- `search(query, count?, start?, filter_format?)` — full GOV.UK search
- `organisations(start?, count?)` — list organisations (departments, agencies, …)
- `taxons(base_path?)` — taxonomy tree node
- `search_autocomplete(query)` — autocomplete on the search index

## Data sources

- Content API: `https://www.gov.uk/api/content/`
- Search API: `https://www.gov.uk/api/search.json`

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "gov-uk-content": {
      "url": "https://gateway.pipeworx.io/gov-uk-content/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Gov Uk Content data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
