# Remove FlashData Tool

Use the local recipe record to reverse only this installation's changes.
Every step is idempotent; absent entries are already removed.

1. Inspect each recorded group with `ncl groups config get --id <group-id>`.
   Remove the install-owned server with
   `ncl groups config remove-mcp-server --id <group-id> --name flashdata`.
   Restore any prior `flashdata` configuration saved before installation
   through `ncl groups config add-mcp-server`. If ownership has since changed
   to a plugin, stop for that group and use its template update/restamp
   workflow; config commands cannot overwrite plugin-owned entries.
2. Remove the complete `<!-- flashdata:start -->` through
   `<!-- flashdata:end -->` block from each selected group's
   `instructions.prepend.md`, or restore the recorded pre-existing block.
   Preserve surrounding content. Remove a newly created file only if it is
   now empty.
3. Remove `src/flashdata-manifest.test.ts` if this install added it. Restore
   a pre-existing version from the local installation record if it was
   updated.
4. Remove the `mcp-remote` object from `container/cli-tools.json` only when
   this install added it and no other configured MCP server uses that
   command. Keep a pre-existing/shared entry. Rebuild with
   `./container/build.sh` if the manifest changed.
5. In the selected gateway's documented administration workflow, revoke only
   the FlashData grants added by this install. Preserve pre-existing grants
   and shared secrets. Delete an install-created secret or allow-host rule
   only after verifying no remaining group/integration uses it. Record a
   shared item left in place and its owner. Restore prior gateway policy
   values without switching providers or weakening the network boundary.
6. Restart affected groups with `ncl groups restart --id <group-id>` and
   inspect their configurations again. Confirm the install-owned server and
   instruction block are absent, unrelated tools remain, and removed grants
   no longer authorize requests. Handle approval-pending as in installation.
7. Remove this skill's entry from the fork's recipe after recording removal.

Reapplying this removal must leave the same state.
