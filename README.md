# Repro: MCP `agent_update` fails under the eve dev host

`agent_update` on the MCP channel throws
`TypeError: this[#t](...)[INTERNAL_CHANNEL_DELIVER] is not a function`
whenever the agent runs on the local development host (`eve dev`, or the
local target `eve eval` starts). The same agent works after `eve build` +
`eve start`.

> **Platform: reproduces on Windows only.** On Linux (`node:24-bookworm`,
> Node 24.21.0, pnpm 11.1.2) the same commit passes. The dev-host process
> loads `channel/channel-operations.js` twice on both platforms; on Windows the
> host builds its channel handle from the copy inlined into the dev bundle,
> while `workflow-execution.js` uses the `node_modules` copy, so the
> `INTERNAL_CHANNEL_DELIVER` Symbols differ. Runtime trace:
> https://github.com/vercel/eve/issues/3673

Created with `pnpm dlx eve@0.64.1 init --non-interactive`. The only changes on
top of the scaffold:

| File | Why |
| --- | --- |
| `agent/agent.ts` | `mockModel` that calls one tool, then answers — no provider credentials needed |
| `agent/tools/write_thing.ts` | a tool with `approval: always()`, so the invocation reaches `input_required` |
| `agent/channels/mcp.ts` | `mcpChannel({ auth: localDev() })` |
| `evals/mcp-agent-update.eval.ts` | drives `agent_start` → `agent_get` → `agent_update` over `/eve/v1/mcp` |

## Reproduce

```sh
pnpm install
pnpm exec eve eval --verbose
```

Expected: `agent_update` accepts the approval and returns the invocation
state (`status: "working"`), and the eval passes.

Actual: `agent_update` returns `isError: true` with
`{"code":"internal", ...}`, and the server logs
`TypeError: this[#t](...)[INTERNAL_CHANNEL_DELIVER] is not a function`
(full output in the issue). The eval fails on `agent_update accepted`.

## It works in production

Switch the channel to `none()` (`localDev()` refuses production), then:

```sh
pnpm exec eve build --skip-sandbox-prewarm
pnpm exec eve start --port 3998
```

Driving the same three calls against `http://127.0.0.1:3998/eve/v1/mcp` gives
`input_required` → `agent_update` → `working` → `completed` with
`done: {"wrote":"x"}`.

The original scaffold README is in `README.eve-init.md`.
