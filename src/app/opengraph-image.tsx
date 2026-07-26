import { ImageResponse } from "next/og";

export const alt = "TEKMESIS — FROM STUDIES TO CLARITY.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamically rendered (Satori/next-og), not a static asset — no external
 * image-generation tool is available, and this needs no external asset:
 * plain JSX/inline styles rendered server-side into a PNG. Closes the
 * "no Open Graph image" gap tracked in OPEN_RISKS.md #17(a).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          backgroundColor: "#071726",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="140" height="158" viewBox="0 0 32 36">
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
        <div style={{ display: "flex", color: "white", fontSize: 84, fontWeight: 700 }}>
          TEKMESIS
        </div>
        <div
          style={{
            display: "flex",
            color: "#3fc2cc",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          From studies to clarity.
        </div>
      </div>
    ),
    { ...size },
  );
}
