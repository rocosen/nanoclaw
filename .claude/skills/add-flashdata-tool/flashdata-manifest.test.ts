// The bridge is the source-backed integration point. MCP registrations are
// per-group runtime state and are verified by the install workflow.
import fs from 'fs';
import path from 'path';

import { describe, expect, it } from 'vitest';

function repoRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'container', 'cli-tools.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('container/cli-tools.json not found from ' + __dirname);
}

describe('FlashData MCP bridge in the agent image', () => {
  const root = repoRoot();
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'container', 'cli-tools.json'), 'utf8'),
  ) as Array<{ name: string; version: string }>;

  it('has exactly one bridge with an exact version pin', () => {
    const bridges = manifest.filter((entry) => entry.name === 'mcp-remote');
    expect(bridges).toHaveLength(1);
    expect(bridges[0].version).toMatch(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/);
  });
});
