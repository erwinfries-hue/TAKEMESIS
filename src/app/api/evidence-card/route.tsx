import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { ConfidenceLabel } from "@/lib/eligibility/teaser";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const VALID_LABELS: ConfidenceLabel[] = [
  "higher",
  "moderate",
  "limited",
  "very_uncertain",
  "not_assessed",
];

const FILLED_SEGMENTS: Record<ConfidenceLabel, number> = {
  not_assessed: 0,
  very_uncertain: 1,
  limited: 2,
  moderate: 3,
  higher: 4,
};

const MAX_QUESTION_CHARS = 180;

/**
 * User-triggered, opt-in share image ("teilbare Evidence Card") — never
 * generated automatically. Only carries what the user chose to type
 * themselves (their own question, truncated) plus the already-public
 * confidence label and topic name; never study titles, prices, or
 * anything from the paid report.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale: Locale = searchParams.get("locale") === "en" ? "en" : "de";
  const dict = getDictionary(locale);
  const rawLabel = searchParams.get("confidence");
  const confidenceLabel: ConfidenceLabel = VALID_LABELS.includes(rawLabel as ConfidenceLabel)
    ? (rawLabel as ConfidenceLabel)
    : "not_assessed";
  const question = (searchParams.get("q") ?? "").slice(0, MAX_QUESTION_CHARS);
  const topic = (searchParams.get("topic") ?? "").slice(0, 80);
  const filled = FILLED_SEGMENTS[confidenceLabel];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          backgroundColor: "#071726",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="40" height="45" viewBox="0 0 32 36">
            <path
              d="M16 2 L29 7 V17 C29 25.5 23.5 32 16 34.5 C8.5 32 3 25.5 3 17 V7 Z"
              fill="#12a3ae"
            />
            <path
              d="M10.5 12.5h11M16 12.5v14"
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <div style={{ display: "flex", color: "white", fontSize: 32, fontWeight: 700 }}>
            {dict.brand.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {topic && (
            <div
              style={{
                display: "flex",
                color: "#3fc2cc",
                fontSize: 24,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {topic}
            </div>
          )}
          <div style={{ display: "flex", color: "white", fontSize: 46, fontWeight: 700, lineHeight: 1.25 }}>
            {question || dict.brand.claim}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                style={{
                  width: 44,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: index < filled ? "#12a3ae" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", color: "white", fontSize: 26, fontWeight: 600 }}>
            {dict.confidenceLabels[confidenceLabel]}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
