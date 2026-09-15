import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "@/config/env";
import { ApiError } from "@/utils/ApiError";

const cvAnalysisSchema = z.object({
  score: z.number().int().min(0).max(100),
  level: z.enum(["Junior", "Mid", "Senior"]),
  skills: z.array(
    z.object({
      name: z.string(),
      level: z.enum(["Beginner", "Intermediate", "Strong"]),
    }),
  ),
  strengths: z.array(z.string()),
  missingSkills: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type CvAnalysis = z.infer<typeof cvAnalysisSchema>;

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

const systemPrompt = `You are a technical CV reviewer. Analyze the provided CV and respond with ONLY valid JSON, with no markdown fences and no preamble. The response must match exactly this shape:
{
  "score": number (0-100),
  "level": string ("Junior" | "Mid" | "Senior"),
  "skills": [{ "name": string, "level": "Beginner" | "Intermediate" | "Strong" }],
  "strengths": string[],
  "missingSkills": string[],
  "recommendations": string[]
}`;

function stripMarkdownFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

type GenerateContentResponse = Awaited<ReturnType<typeof ai.models.generateContent>>;

function isTransientGeminiError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const errorRecord = error as Record<string, unknown>;
  const status = errorRecord.status;
  const message = errorRecord.message;

  return (
    status === 503 ||
    status === 429 ||
    status === "UNAVAILABLE" ||
    (typeof message === "string" && message.includes("UNAVAILABLE"))
  );
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function generateWithRetry(prompt: string, retries = 3): Promise<GenerateContentResponse> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });
    } catch (err) {
      if (!isTransientGeminiError(err)) throw err;
      if (attempt === retries) {
        throw ApiError.serviceUnavailable(
          "AI analysis is temporarily unavailable. Please try again shortly.",
          "AI_PROVIDER_UNAVAILABLE",
        );
      }
      await wait(500 * 2 ** attempt);
    }
  }

  throw ApiError.serviceUnavailable(
    "AI analysis is temporarily unavailable. Please try again shortly.",
    "AI_PROVIDER_UNAVAILABLE",
  );
}

export async function analyzeCvText(resumeText: string): Promise<CvAnalysis> {
  let rawText: string | undefined;

  try {
    const response = await generateWithRetry(`${systemPrompt}\n\n${resumeText}`);
    rawText = response.text;
  } catch (err) {
    if (err instanceof ApiError && err.code === "AI_PROVIDER_UNAVAILABLE") {
      throw err;
    }
    console.error("[AI PROVIDER ERROR]", err);
    throw ApiError.internal("AI analysis failed. Please try again.", "AI_PROVIDER_ERROR");
  }

  let parsed: unknown;
  try {
    if (!rawText) {
      throw new Error("Gemini returned an empty response");
    }
    parsed = JSON.parse(stripMarkdownFences(rawText));
  } catch {
    console.error("[AI INVALID RESPONSE]", rawText);
    throw ApiError.internal("AI returned an invalid response", "AI_INVALID_RESPONSE");
  }

  const validated = cvAnalysisSchema.safeParse(parsed);
  if (!validated.success) {
    throw ApiError.internal("AI returned an invalid response", "AI_INVALID_RESPONSE");
  }

  return validated.data;
}