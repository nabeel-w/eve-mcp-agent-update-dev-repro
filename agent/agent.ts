import { defineAgent } from "eve";
import { mockModel } from "eve/evals";

// Deterministic, no provider credentials needed: the first step calls the
// approval-gated tool, the next one answers with its result.
export default defineAgent({
  modelContextWindowTokens: 200_000,
  model: mockModel(({ toolResults }) =>
    toolResults.length === 0
      ? { toolCalls: [{ name: "write_thing", input: { value: "x" } }] }
      : `done: ${JSON.stringify(toolResults[0]?.output)}`,
  ),
});
