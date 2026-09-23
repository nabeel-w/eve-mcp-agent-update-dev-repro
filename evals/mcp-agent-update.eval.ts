import { defineEval, type EveEvalContext } from "eve/evals";
import { equals } from "eve/evals/expect";

let id = 0;
async function mcp(t: EveEvalContext, name: string, args: unknown) {
  const res = await t.target.fetch("/eve/v1/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": "2025-11-25",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }),
  });
  const text = await res.text();
  const body = text.trim().startsWith("{")
    ? JSON.parse(text)
    : JSON.parse(text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).join(""));
  return body.result;
}

export default defineEval({
  timeoutMs: 60_000,
  async test(t) {
    const started = (await mcp(t, "agent_start", { message: "go" })).structuredContent;
    t.log(`agent_start -> ${JSON.stringify(started)}`);

    let state: any;
    for (let i = 0; i < 30; i++) {
      await t.sleep(1000);
      state = (await mcp(t, "agent_get", { invocationId: started.invocationId })).structuredContent;
      if (state.status !== "working") break;
    }
    t.log(`agent_get -> status ${state.status}`);
    await t.require(state.status, equals("input_required"));

    const responses = Object.values(state.inputRequests as Record<string, { requestId: string }>).map(
      (r) => ({ requestId: r.requestId, optionId: "approve" }),
    );
    const updated = await mcp(t, "agent_update", { invocationId: started.invocationId, responses });
    t.log(`agent_update -> ${JSON.stringify(updated)}`);

    // Expected: a successful update returning the invocation state.
    t.check(updated.isError ?? false, equals(false)).label("agent_update accepted");
  },
});
