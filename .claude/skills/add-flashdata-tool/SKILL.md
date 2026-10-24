---
name: add-flashdata-tool
description: Add FlashData Google search, news, images, shopping, places and YouTube research through remote MCP for selected NanoClaw groups, with the user's paid API key held by the installed credential gateway.
---

# Add FlashData Tool

![FlashData](https://raw.githubusercontent.com/rocosen/flashdata-mcp/main/assets/logo.svg)

Install the pinned MCP bridge and register one FlashData server for selected
agent groups. The remote server supplies schemas for the sources authorized
by the operator's key. This skill enables 14 research capabilities. Media
download remains disabled until gateway-managed storage credentials have
been implemented and verified; see [usage.md](usage.md).

Installation is free. Data queries consume the user's own paid
[FlashData Credits](https://flashdata.dev/pricing). The gateway holds the
user's [FlashData API key](https://flashdata.dev/app/api-keys).

## 1. Select groups and record the existing state

Use `AskUserQuestion` to select the groups and confirm the paid-data model.
Inspect the installed credential gateway and its own skill, then run:

```bash
ncl groups list
ncl groups config get --id <group-id>
```

For each selected group, record whether a `flashdata` server and a
`<!-- flashdata:start -->` instruction block already exist. Record their
previous values locally without including credentials. Preserve unrelated
servers and instructions. If an existing entry is plugin-owned, use that
plugin's template update/restamp workflow; the config commands reject it.
Stop this skill for that group until the owner resolves the name conflict.
For an ordinary existing entry from another install, agree on updating it
before replacing it. Reapplying this skill updates the same entry and block.

Inspect `container/cli-tools.json` and record whether `mcp-remote` already
exists. Reuse a pre-existing exact version. A missing or unavailable gateway
is a setup prerequisite: resolve it through that gateway's own skill before
continuing. Keep this installation's selected gateway and security policy.

## 2. Grant the credential through the installed gateway

The operator stores the key outside the agent and grants it only to the
selected groups. The bridge's args and env stay free of real keys.

### OneCLI

Run the grants compatibility check from the host:

```bash
sh .claude/skills/add-onecli/scripts/check-grants-gateway.sh /add-flashdata-tool
onecli agents list --max 0
```

If the check fails, resolve the gateway upgrade through `/add-onecli` before
granting the key. In the OneCLI dashboard, create or reuse a generic secret
for host `data.flashdata.dev`, header `X-API-Key`, value format `{value}`.
Have the operator enter the key directly in the dashboard. Select the agent
IDs corresponding to the chosen NanoClaw groups and attach the secret:

```bash
onecli agents grants attach-secret --id <agent-id> --secret-id <secret-id>
onecli agents grants list --id <agent-id>
```

Record the non-secret IDs and which grants this install added for removal.
Retain an existing matching grant on reapply.

### Iron

Follow `/add-iron-proxy` and its `references/control-plane.md`. In the
official Secrets screen, create or reuse a Static Secret with host
`data.flashdata.dev`, path `/mcp`, methods needed by Streamable HTTP
(`POST`, `GET`, `DELETE`), header `X-API-Key`, and formatter `{{ .Value }}`.
The operator enters the real value directly in that control plane.

Use that skill's `control.ts grant static <secret-id>` helper for this
installation's principal. Add `data.flashdata.dev` through its documented
`setup.ts --allow-host` flow when needed; preserve all existing hosts.
Keep the gateway's per-session identity and approval rules. Record only
non-secret IDs, prior allowlist state and grants added by this install.

For another gateway, establish the same host-scoped header injection using
its documented credential workflow before registering the MCP server.

## 3. Install the bridge

If `mcp-remote` is absent, append this object to `container/cli-tools.json`:

```json
{
  "name": "mcp-remote",
  "version": "0.1.38"
}
```

Preserve existing entries and the valid top-level JSON array. Copy the
dependency guard and build the selected installation's image:

```bash
cp .claude/skills/add-flashdata-tool/flashdata-manifest.test.ts src/flashdata-manifest.test.ts
./container/build.sh
pnpm exec vitest run src/flashdata-manifest.test.ts
pnpm run typecheck
```

The CLI manifest is the source-backed integration point. Per-group MCP
registration and instruction blocks are runtime state managed by `ncl` and
the group's instruction file, so there is no source registration line for
an in-tree test to guard.

## 4. Register and load the usage instructions

For each selected group:

```bash
ncl groups config add-mcp-server \
  --id <group-id> \
  --name flashdata \
  --command mcp-remote \
  --args '["https://data.flashdata.dev/mcp","--transport","http-only","--enable-proxy","--ignore-tool","youtube_download","--ignore-tool","submit_batch"]' \
  --env '{}'
```

Both direct download and batch submission are filtered because download
requires storage secrets in the request body. The selected gateway injects
the API key header; use the 14 individual research tools for data queries.

Copy the complete marked block from [usage.md](usage.md) into each selected
group's `groups/<group-folder>/instructions.prepend.md`. Replace an existing
FlashData block in place, otherwise append it. Preserve the surrounding
content. The generated group `CLAUDE.md` is not the source to edit.

```bash
ncl groups restart --id <group-id>
ncl groups config get --id <group-id>
```

These commands are approval-gated inside a container. An
`approval-pending` response means wait for the administrator's approval and
the follow-up message before proceeding.

## 5. Verify discovery before any query

In the selected group's MCP client, initialize the connection and list its
tools. Confirm `google_search` first, then the other authorized research
tools in [usage.md](usage.md). Confirm `youtube_download` and `submit_batch`
are absent. Discovery is not a paid retrieval test. For a key scoped to a
subset, record the actual subset rather than claiming all 14.

After the user authorizes a data task and budget, let the agent choose the
appropriate tool from its live schema. A Google Search smoke query can use
`{"query":"battery recycling research","num":1,"gl":"us","hl":"en"}`.
Record whether the response is complete or an asynchronous job; never use a
mock response as evidence of real retrieval.

## Recipe and removal

Apply after the selected gateway is installed and the target groups exist.
Record `/add-flashdata-tool` in the fork's recipe with those prerequisites,
selected group IDs, original state and install-owned additions. Share the
existing bridge with other MCP skills rather than duplicating it.

Follow [REMOVE.md](REMOVE.md) to reverse the installation.

## Troubleshooting

- Missing bridge: rebuild the image and restart the selected group.
- HTTP 401/403: have the operator check the gateway's host/header rule, grant
  and API key source scopes. Inspect redacted diagnostics; keep the key in
  the gateway.
- Proxy or certificate errors: follow the selected gateway's troubleshooting
  instructions. Restore its normal proxy/trust configuration.
- Missing tools: inspect the selected group's stored MCP configuration and
  the key's source permissions, then restart it.
- Insufficient Credits or a rate limit: stop paid submissions and report the
  response. The operator decides account or budget changes.
- A query times out: inspect the existing job or Request History before
  deciding whether another paid submission is needed.

## References

- [FlashData MCP guide](https://flashdata.dev/docs/mcp)
- [FlashData sources and limits](https://github.com/rocosen/flashdata-mcp)
- [mcp-remote](https://github.com/geelen/mcp-remote)
