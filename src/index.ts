interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * GOV.UK Content + Search APIs.
 */


const BASE = 'https://www.gov.uk';
const UA = 'pipeworx-mcp-gov-uk-content/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  { name: 'content', description: 'Content for a gov.uk page by base_path.', inputSchema: { type: 'object', properties: { base_path: { type: 'string' } }, required: ['base_path'] } },
  { name: 'search', description: 'GOV.UK full search.', inputSchema: { type: 'object', properties: { query: { type: 'string' }, count: { type: 'number' }, start: { type: 'number' }, filter_format: { type: 'string' } }, required: ['query'] } },
  { name: 'organisations', description: 'List organisations.', inputSchema: { type: 'object', properties: { start: { type: 'number' }, count: { type: 'number' } } } },
  { name: 'taxons', description: 'Taxonomy tree node.', inputSchema: { type: 'object', properties: { base_path: { type: 'string' } } } },
  { name: 'search_autocomplete', description: 'Autocomplete suggestions.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'content': {
      const p = reqStr(args, 'base_path', '"/jobsearch"').replace(/^\/+/, '/');
      return ukGet(`/api/content${p}`);
    }
    case 'search': {
      const p = new URLSearchParams({
        q: reqStr(args, 'query', '"passport renewal"'),
        count: String(Math.min(100, Math.max(1, (args.count as number) ?? 20))),
        start: String(Math.max(0, (args.start as number) ?? 0)),
      });
      if (args.filter_format) p.set('filter_format', String(args.filter_format));
      return ukGet(`/api/search.json?${p}`);
    }
    case 'organisations': {
      const start = Math.max(0, (args.start as number) ?? 0);
      const count = Math.min(100, Math.max(1, (args.count as number) ?? 20));
      const p = new URLSearchParams({
        filter_format: 'organisation',
        count: String(count),
        start: String(start),
        fields: 'title,link,format,acronym,organisation_state',
      });
      return ukGet(`/api/search.json?${p}`);
    }
    case 'taxons': {
      const path = (args.base_path as string | undefined) ?? '/';
      return ukGet(`/api/content${path.replace(/^\/+/, '/')}`);
    }
    case 'search_autocomplete': {
      const p = new URLSearchParams({ q: reqStr(args, 'query', '"passport"') });
      return ukGet(`/autocomplete?${p}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function ukGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (res.status === 404) throw new Error('GOV.UK: not found');
  if (!res.ok) throw new Error(`GOV.UK: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
