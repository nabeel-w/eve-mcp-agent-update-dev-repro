import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

export default defineTool({
  description: "A write that always needs human approval.",
  inputSchema: z.object({ value: z.string() }),
  approval: always(),
  async execute({ value }) {
    return { wrote: value };
  },
});
