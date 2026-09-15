import Groq from "groq-sdk";
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

const groq = new Groq({ apiKey: env.groqApiKey });

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

export async function analyzeCvText(resumeText: string): Promise<CvAnalysis> {
  let rawText: string | null | undefined;

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: resumeText },
      ],
    });
    rawText = completion.choices[0]?.message.content;
  } catch (err) {
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
    throw ApiError.internal("AI returned an invalid response", "AI_INVALID_RESPONSE");
  }

  const validated = cvAnalysisSchema.safeParse(parsed);
  if (!validated.success) {
    throw ApiError.internal("AI returned an invalid response", "AI_INVALID_RESPONSE");
  }

  return validated.data;
}