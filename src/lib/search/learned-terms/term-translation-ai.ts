import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";
import { serverEnv } from "@/lib/env/server";
import { getAnthropicClient } from "@/lib/ai/anthropic-client";

/** Same DI pattern as study-extraction.ts's AiMessagesClient — lets tests pass a fake client. */
export type AiMessagesClient = Pick<Anthropic["messages"], "create">;

const TRANSLATIONS_SCHEMA = z.object({
  translations: z.array(z.object({ term: z.string(), translation: z.string() })),
});

const TOOL_NAME = "record_term_translations";

const TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description: "Record the English translation for each given single-word search-query term.",
  input_schema: {
    type: "object",
    properties: {
      translations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            term: { type: "string", description: "The original term, exactly as given." },
            translation: {
              type: "string",
              description:
                "Its English translation — a single word or short phrase, lowercase, no punctuation. If the term is a proper noun, brand name, or already English, return it unchanged.",
            },
          },
          required: ["term", "translation"],
        },
      },
    },
    required: ["translations"],
  },
};

const LOCALE_NAME: Partial<Record<Locale, string>> = { de: "German", fr: "French" };

/**
 * AI fallback for query-translation.ts's static dictionaries
 * (de-en-dictionary.ts / fr-en-dictionary.ts): translates tokens that
 * aren't in the static dictionary or the learned-terms cache. This is a
 * one-word-at-a-time lookup, not a sentence translator — no surrounding
 * question context is given, deliberately, so the model can't "helpfully"
 * rephrase or drop terms; it only ever returns a 1:1 term→translation pair
 * per input.
 */
const SYSTEM_PROMPT = `You translate individual single-word search-query terms to English for a scientific/biomedical literature search.

Rules:
- Translate each given term to its single best English equivalent — a common word or short phrase used in English scientific writing.
- If a term is a proper noun, brand name, acronym, or already English, return it unchanged.
- Do not add, merge, or omit terms — return exactly one translation per input term.
- Return only the translation itself, lowercase, no explanation, no punctuation.`;

export async function translateTermsWithAi(
  terms: string[],
  locale: Locale,
  client: AiMessagesClient = getAnthropicClient().messages,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (terms.length === 0) {
    return result;
  }

  const localeName = LOCALE_NAME[locale];
  if (!localeName) {
    return result;
  }

  const response = await client.create({
    model: serverEnv.AI_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [
      {
        role: "user",
        content: `Source language: ${localeName}\nTerms: ${terms.join(", ")}`,
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    return result;
  }
  const parsed = TRANSLATIONS_SCHEMA.safeParse(toolUse.input);
  if (!parsed.success) {
    console.error("AI term translation returned an unexpected shape:", parsed.error);
    return result;
  }

  // Only keep pairs for terms we actually asked about, in case the model
  // adds noise — never let AI output introduce an unrequested translation.
  const requested = new Set(terms);
  for (const { term, translation } of parsed.data.translations) {
    if (requested.has(term) && translation.trim().length > 0) {
      result.set(term, translation.trim().toLowerCase());
    }
  }
  return result;
}
