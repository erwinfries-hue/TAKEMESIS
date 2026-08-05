import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";
import { serverEnv } from "@/lib/env/server";
import { getAnthropicClient } from "./anthropic-client";
import type { AiMessagesClient } from "./study-extraction";

const RESEARCHABILITY_TOOL_NAME = "classify_researchability";

const RESEARCHABILITY_TOOL: Anthropic.Tool = {
  name: RESEARCHABILITY_TOOL_NAME,
  description:
    "Classify whether a question can be answered by systematically searching and synthesizing peer-reviewed academic/scientific literature.",
  input_schema: {
    type: "object",
    properties: {
      researchable: {
        type: "boolean",
        description:
          "True for a general question about effects, relationships, interventions, or outcomes — answerable by aggregating findings across peer-reviewed studies. False for a specific factual, trivia, historical, or definitional question about one named entity (a measurement, date, name, or straightforward fact), which no literature synthesis can meaningfully answer.",
      },
    },
    required: ["researchable"],
  },
};

const RESULT_SCHEMA = z.object({ researchable: z.boolean() });

/**
 * Judges the question's *type*, never its topic's evidence volume — the
 * eligibility engine (eligibility.ts) already handles "not enough studies
 * found" honestly, including for genuinely researchable questions with thin
 * coverage. This exists only to catch the other failure mode found live
 * (docs/OPEN_RISKS.md #34): a trivia/factual question that happens to share
 * enough generic vocabulary with real papers to clear screening anyway.
 */
const SYSTEM_PROMPT = `You classify whether a question is the kind that scientific/academic literature synthesis can answer at all — not whether you personally know a lot about the topic, and not whether much research literature happens to exist on it (a genuinely good research question with currently thin evidence is still "researchable").

Researchable: general questions about effects, relationships, interventions, or outcomes, evaluated across a population or group. Examples: "Which measures reduce the risk of back pain?", "Does creatine improve physical performance?", "How does remote work affect productivity?".

Not researchable: specific factual, trivia, historical, or definitional questions about one named entity — a measurement, date, name, or straightforward fact that has one correct answer, not a body of aggregated evidence. Examples: "Why is the Eiffel Tower so tall?", "How old is the Earth?", "Who invented the telephone?", "How many inhabitants does Paris have?".

The question may be in German, English, or French.`;

/**
 * Returns `null` on any AI error or malformed response — same fail-safe
 * contract as extractStudyFields — so the caller (classification/
 * researchability.ts) can fail open rather than block search on an AI
 * hiccup.
 */
export async function classifyResearchability(
  question: string,
  locale: Locale,
  client: AiMessagesClient = getAnthropicClient().messages,
): Promise<boolean | null> {
  const response = await client.create({
    model: serverEnv.AI_MODEL,
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    tools: [RESEARCHABILITY_TOOL],
    tool_choice: { type: "tool", name: RESEARCHABILITY_TOOL_NAME },
    messages: [{ role: "user", content: `Locale: ${locale}\nQuestion: ${question}` }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    return null;
  }
  const parsed = RESULT_SCHEMA.safeParse(toolUse.input);
  if (!parsed.success) {
    console.error("AI researchability classification returned an unexpected shape:", parsed.error);
    return null;
  }
  return parsed.data.researchable;
}
