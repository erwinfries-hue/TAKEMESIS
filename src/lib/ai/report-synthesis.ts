import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { serverEnv } from "@/lib/env/server";
import { getAnthropicClient } from "./anthropic-client";
import type { AiMessagesClient, ExtractedStudyFields } from "./study-extraction";

export interface ReportSynthesisStudyInput {
  citation: string;
  design: string;
  fields: ExtractedStudyFields | null;
}

export interface ReportSynthesisInput {
  question: string;
  confidenceLabel: string;
  studies: ReportSynthesisStudyInput[];
}

const REPORT_SYNTHESIS_RESULT_SCHEMA = z.object({
  keyFindings: z.array(z.string()),
  synthesis: z.string(),
  practicalInterpretation: z.string(),
});

export type ReportSynthesisResult = z.infer<typeof REPORT_SYNTHESIS_RESULT_SCHEMA>;

const SYNTHESIS_TOOL_NAME = "record_report_synthesis";

const SYNTHESIS_TOOL: Anthropic.Tool = {
  name: SYNTHESIS_TOOL_NAME,
  description: "Record the synthesis of a set of studies answering a specific question.",
  input_schema: {
    type: "object",
    properties: {
      keyFindings: {
        type: "array",
        items: { type: "string" },
        description:
          "3-6 short key findings summarizing what the evidence shows, each grounded only in the provided study summaries.",
      },
      synthesis: {
        type: "string",
        description:
          "A short paragraph (3-6 sentences) synthesizing across all studies: where they agree, where they disagree, and the overall picture.",
      },
      practicalInterpretation: {
        type: "string",
        description:
          "A short paragraph (2-4 sentences) translating the evidence into general, plain-language orientation — never individualized medical, legal, or financial advice.",
      },
    },
    required: ["keyFindings", "synthesis", "practicalInterpretation"],
  },
};

/**
 * Hard evidence-safety constraints from
 * docs/08_EVIDENCE_SAFETY_AND_CONFIDENCE_MODEL.md and CLAUDE.md: never turn
 * association into causation, never equate absence of evidence with
 * evidence of absence, never give individualized advice, always reflect
 * the stated confidence level and disagreement between studies rather than
 * smoothing it over.
 */
const SYSTEM_PROMPT = `You synthesize a set of already-extracted study summaries to answer one question. Rules:
- Base every statement only on the provided study summaries. Never use outside knowledge about the topic.
- Never claim causation when a study only reports correlation/association.
- If evidence is limited or mixed, say so explicitly — do not smooth over disagreement between studies or overstate certainty.
- Never claim "no evidence of an effect" means "evidence of no effect".
- The practical interpretation must stay general orientation, not individualized medical, legal, or financial advice, and must not replace professional consultation.
- Write in the same language as the question.
- Reflect the given overall confidence level honestly in your tone.`;

function formatStudy(study: ReportSynthesisStudyInput, index: number): string {
  const f = study.fields;
  const lines = [
    `Study ${index + 1}: ${study.citation} (${study.design})`,
    f?.population ? `Population: ${f.population}` : null,
    f?.intervention ? `Intervention: ${f.intervention}` : null,
    f?.outcome ? `Outcome measured: ${f.outcome}` : null,
    f?.result ? `Result: ${f.result}` : null,
    f?.uncertainty ? `Uncertainty: ${f.uncertainty}` : null,
    f?.limitations ? `Limitations: ${f.limitations}` : null,
  ].filter((line): line is string => line !== null);
  return lines.join("\n");
}

export async function synthesizeReport(
  input: ReportSynthesisInput,
  client: AiMessagesClient = getAnthropicClient().messages,
): Promise<ReportSynthesisResult | null> {
  if (input.studies.length === 0) {
    return null;
  }

  const studySummaries = input.studies.map(formatStudy).join("\n\n");
  const userContent = `Question: ${input.question}\nOverall evidence confidence: ${input.confidenceLabel}\n\nStudy summaries:\n\n${studySummaries.slice(0, serverEnv.AI_MAX_INPUT_CHARS)}`;

  const response = await client.create({
    model: serverEnv.AI_MODEL,
    max_tokens: 1536,
    system: SYSTEM_PROMPT,
    tools: [SYNTHESIS_TOOL],
    tool_choice: { type: "tool", name: SYNTHESIS_TOOL_NAME },
    messages: [{ role: "user", content: userContent }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    return null;
  }
  const parsed = REPORT_SYNTHESIS_RESULT_SCHEMA.safeParse(toolUse.input);
  if (!parsed.success) {
    console.error("AI report synthesis returned an unexpected shape:", parsed.error);
    return null;
  }
  return parsed.data;
}
