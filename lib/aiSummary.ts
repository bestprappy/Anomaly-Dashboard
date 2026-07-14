import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

/** Free-tier Gemini model used for section summaries. */
export const AI_SUMMARY_MODEL_ID = "gemini-2.5-flash-lite";

// Static export runs entirely in the browser, so the key must be a
// NEXT_PUBLIC_ variable inlined at build time.
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export const isAISummaryConfigured = Boolean(apiKey);

const google = apiKey ? createGoogleGenerativeAI({ apiKey }) : null;

/** Keep prompts small so summaries stay within free-tier token limits. */
const MAX_DATA_CHARS = 6000;

const SYSTEM_PROMPT = [
  "You are an analyst for a telecom-site electricity billing anomaly dashboard.",
  "Providers are PEA and MEA; tower companies are BFKT, TUC, and TMV.",
  "Months are coded as YYYYMM (e.g. 202401 = Jan 2024) and bill amounts are in Thai Baht.",
  "Given a dashboard section name and its underlying data as JSON, write a 2-3 sentence plain-English summary.",
  "Lead with the most important insight or anomaly and include concrete numbers.",
  "Do not describe the JSON structure, repeat the section name, or use markdown formatting.",
].join(" ");

function toPromptPayload(data: unknown): string {
  const payload = JSON.stringify(data);
  if (payload.length <= MAX_DATA_CHARS) return payload;
  return `${payload.slice(0, MAX_DATA_CHARS)} ... (payload truncated)`;
}

function toFriendlyError(err: unknown): Error {
  const statusCode =
    err && typeof err === "object" && "statusCode" in err
      ? (err as { statusCode?: unknown }).statusCode
      : undefined;

  if (statusCode === 429) {
    return new Error(
      "The Gemini API quota or credits are exhausted. Summaries will resume once quota is available."
    );
  }
  if (statusCode === 401 || statusCode === 403) {
    return new Error("The Gemini API key was rejected. Check NEXT_PUBLIC_GEMINI_API_KEY.");
  }
  return err instanceof Error ? err : new Error("AI summary request failed.");
}

/**
 * Summarize the data behind one dashboard section. Callers pass a compact,
 * serializable snapshot of what the table/chart below renders.
 */
export async function generateSectionSummary(
  sectionTitle: string,
  data: unknown
): Promise<string> {
  if (!google) {
    throw new Error("AI summaries are not configured (missing NEXT_PUBLIC_GEMINI_API_KEY).");
  }

  try {
    const { text } = await generateText({
      model: google(AI_SUMMARY_MODEL_ID),
      system: SYSTEM_PROMPT,
      prompt: `Section: ${sectionTitle}\nData (JSON): ${toPromptPayload(data)}`,
    });

    const summary = text.trim();
    if (!summary) throw new Error("The model returned an empty summary.");
    return summary;
  } catch (err) {
    console.error(`[aiSummary] generation failed for "${sectionTitle}"`, err);
    throw toFriendlyError(err);
  }
}
