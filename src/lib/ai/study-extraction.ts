import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { NormalizedRecord } from "@/lib/source-adapters/types";
import { serverEnv } from "@/lib/env/server";
import { getAnthropicClient } from "./anthropic-client";

/** Minimal slice of the SDK this module needs — lets tests pass a fake client instead of constructing a real one (which requires ANTHROPIC_API_KEY), same DI pattern as EmailSendingClient/Stripe's webhooks client. */
export type AiMessagesClient = Pick<Anthropic["messages"], "create">;

export interface ExtractedStudyFields {
  population: string | null;
  intervention: string | null;
  outcome: string | null;
  result: string | null;
  uncertainty: string | null;
  limitations: string | null;
  fundingConflicts: string | null;
}

const EXTRACTION_TOOL_NAME = "record_study_fields";

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: EXTRACTION_TOOL_NAME,
  description:
    "Record structured fields extracted from a single study's title and abstract.",
  input_schema: {
    type: "object",
    properties: {
      population: {
        type: ["string", "null"],
        description: "Who was studied (sample/demographics). Null if not explicitly stated.",
      },
      intervention: {
        type: ["string", "null"],
        description: "What was tested or compared. Null if not explicitly stated.",
      },
      outcome: {
        type: ["string", "null"],
        description: "What was measured. Null if not explicitly stated.",
      },
      result: {
        type: ["string", "null"],
        description:
          "What was found, in plain language, without adding certainty the study itself doesn't claim. Null if not explicitly stated.",
      },
      uncertainty: {
        type: ["string", "null"],
        description:
          "Confidence intervals, significance, or other uncertainty explicitly stated in the text. Null if not stated.",
      },
      limitations: {
        type: ["string", "null"],
        description: "Limitations the study itself states. Null if not stated.",
      },
      fundingConflicts: {
        type: ["string", "null"],
        description: "Funding source or conflicts of interest, if mentioned. Null if not stated.",
      },
    },
    required: [
      "population",
      "intervention",
      "outcome",
      "result",
      "uncertainty",
      "limitations",
      "fundingConflicts",
    ],
  },
};

/**
 * Hard evidence-integrity constraint (CLAUDE.md: never invent methods,
 * results, effect sizes, limitations, funding/conflicts) — every field must
 * come only from the given text, or be null. This is a system prompt, not a
 * suggestion: the tool schema forces structured output, but only this
 * instruction stops the model from filling gaps with outside knowledge.
 */
const SYSTEM_PROMPT = `You extract structured facts from a single scientific study's title and abstract.

Rules:
- Only report what is explicitly stated in the given text.
- Never infer, guess, or add outside knowledge, even if you recognize the study.
- If a field is not stated in the text, its value must be null. Do not write "not mentioned", "unclear", or similar text — use null.
- Never turn a correlation the study reports into a causal claim.
- Keep each field to 1-2 concise sentences, in the same language as the input text.`;

export async function extractStudyFields(
  record: Pick<NormalizedRecord, "title" | "abstract">,
  client: AiMessagesClient = getAnthropicClient().messages,
): Promise<ExtractedStudyFields | null> {
  const text = [record.title, record.abstract].filter(Boolean).join("\n\n");
  if (!text.trim()) {
    return null;
  }

  const response = await client.create({
    model: serverEnv.AI_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: EXTRACTION_TOOL_NAME },
    messages: [
      { role: "user", content: `Title and abstract:\n\n${text.slice(0, serverEnv.AI_MAX_INPUT_CHARS)}` },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    return null;
  }
  return toolUse.input as ExtractedStudyFields;
}
