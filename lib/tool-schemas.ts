import { z } from "zod";

export const TOOL_INPUTS = {
  classify_matter: z.object({ description: z.string() }),
  run_conflict_check: z.object({ parties: z.array(z.string()) }),
  collect_intake: z.object({ practiceArea: z.string() }),
  score_case: z.object({ practiceArea: z.string() }),
  schedule_consultation: z.object({ slotId: z.string() }),
  create_crm_matter: z.object({
    matterId: z.string(),
    status: z.string(),
    created: z.boolean(),
  }),
  search_kb: z.object({ query: z.string() }),
  request_handoff: z.object({
    reason: z.enum(["human_requested", "frustration", "low_confidence", "sensitive"]),
    summary: z.string(),
  }),
} as const;

export type ToolName = keyof typeof TOOL_INPUTS;

export function assertToolInput(name: string, input: Record<string, unknown>) {
  const schema = TOOL_INPUTS[name as ToolName];
  if (!schema) throw new Error(`Unknown tool ${name}`);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid ${name} input: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`);
  }
}

export const TOOL_DEFINITIONS = (Object.keys(TOOL_INPUTS) as ToolName[]).map((name) => ({
  type: "function" as const,
  function: {
    name,
    description: name.replaceAll("_", " "),
    parameters: {
      type: "object",
      additionalProperties: false,
    },
  },
}));
