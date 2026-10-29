# @pipeworx/gov-uk-content

[GOV.UK Content API](https://content-api.publishing.service.gov.uk/) MCP — the rendered content + metadata behind every page on gov.uk. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

## Tools

- `content(base_path)` — content for a gov.uk page (e.g. `/jobsearch`, `/government/organisations/cabinet-office`)
- `search(query, count?, start?, filter_format?)` — full GOV.UK search
- `organisations(start?, count?)` — list organisations (departments, agencies, …)
- `taxons(base_path?)` — taxonomy tree node
- `search_autocomplete(query)` — autocomplete on the search index

## Data sources

- Content API: `https://www.gov.uk/api/content/`
- Search API: `https://www.gov.uk/api/search.json`

## UK departmental manuals (fleet #1972)

Topic-level discovery over the largest body of official interpretation on
GOV.UK. All of it was reachable before only if you already knew the `base_path`
of the page you wanted — which is the one thing a caller asking a tax question
does not know.

Measured 2026-09-14 against `www.gov.uk/api/search.json`:

| `filter_format` | count |
|---|---:|
| `hmrc_manual` | 253 |
| `hmrc_manual_section` | 85,559 |
| `manual` (other departments) | 174 |
| `manual_section` | 2,658 |

- `hmrc_manuals(query?, include_other_departments?, count?, start?)` — which manuals exist, with their base_paths.
- `hmrc_manual_search(query, manual?, include_other_departments?, count?, start?)` — a UK tax question in plain words → the sections that answer it, each with `section_id`, `published_at`, `age_days`. `manual` accepts either `"employment-income-manual"` or the full `/hmrc-internal-manuals/employment-income-manual`.
- `hmrc_manual_section(base_path | manual + section_id, max_chars?)` — one section's full text, with `withdrawn`, `first_published_at`, `published_at`, `age_days`.
- `hmrc_manual_changes(manual, since?, section_id?, limit?)` — HMRC's own per-section revision log, **newest first**.

### The freshness trap, written down because it returns a clean 200

A manual's `details.change_notes[]` is a complete revision history served
**oldest first** — 1,025 entries for the Employment Income Manual, running
2016-08-02 to 2026-09-11. Reading `change_notes[0]` as "the latest change"
reports a ten-year-old edit as today's news, with no error anywhere.
`hmrc_manual_changes` sorts explicitly by `published_at` descending rather than
reversing, so a change in upstream ordering cannot silently invert the answer.

A **section's** own `public_updated_at` is the reliable per-section date and is
what every tool here returns as `source_last_modified`. Note it does **not**
equal the section's first change note: `EIM42776` has a change note published
2016-08-02 and a `public_updated_at` of 2022-06-27.

### Licence

Crown copyright, reproduced under the **Open Government Licence v3.0** —
commercial reuse permitted with attribution. These tools proxy `www.gov.uk` live
per request.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/gov-uk-content/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/content \
  -H 'Content-Type: application/json' \
  -d '{"base_path":"/guidance/apply-for-a-uk-visa"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/content`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-gov-uk-content` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/gov-uk-content/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "gov-uk-content": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-gov-uk-content"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Gov Uk Content data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
