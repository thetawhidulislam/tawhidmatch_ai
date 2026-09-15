import Groq from "groq-sdk";
import { z } from "zod";
import { env } from "@/config/env";
import { ApiError } from "@/utils/ApiError";

const interviewQuestionsSchema = z.object({
  questions: z.array(z.string()).length(5),
});

const interviewEvaluationSchema = z.object({
  technicalScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  problemSolvingScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});

export type InterviewEvaluation = z.infer<typeof interviewEvaluationSchema>;

const groq = new Groq({ apiKey: env.groqApiKey });

const questionsSystemPrompt = `You are a technical interviewer. Generate EXACTLY 5 interview questions relevant to the job title, description, and required skills provided. Mix technical and behavioral questions. Respond with ONLY valid JSON, with no markdown fences and no preamble, matching exactly this shape:
{
  "questions": string[]
}`;

const evaluationSystemPrompt = `You are an interview evaluator. Evaluate the candidate using all provided question and answer pairs. Score technical ability, communication, problem solving, and confidence from 0 to 100, calculate an overall score, and identify strengths and areas needing work. Respond with ONLY valid JSON, with no markdown fences and no preamble, matching exactly this shape:
{
  "technicalScore": number,
  "communicationScore": number,
  "problemSolvingScore": number,
  "confidenceScore": number,
  "overallScore": number,
  "strengths": string[],
  "improvements": string[]
}`;

function stripMarkdownFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseJsonResponse(text: string | null | undefined): unknown {
  if (!text) {
    throw ApiError.internal("AI returned an invalid response", "AI_INVALID_RESPONSE");
  }

  try {
    return JSON.parse(stripMarkdownFences(text));
  } catch {
    throw ApiError.internal("AI returned an invalid response", "AI_INVALID_RESPONSE");
  }
}

export async function generateInterviewQuestions(job: {
  title: string;
  description: string;
  skills: string[];
}): Promise<string[]> {
  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: questionsSystemPrompt },
        {
          role: "user",
          content: `Job title: ${job.title}\nJob description: ${job.description}\nRequired skills: ${job.skills.join(", ")}`,
        },
      ],
    });
    const parsed = parseJsonResponse(completion.choices[0]?.message.content);
    const validated = interviewQuestionsSchema.safeParse(parsed);
    if (!validated.success) {
      throw ApiError.internal("AI returned an invalid response", "AI_INVALID_RESPONSE");
    }
    return validated.data.questions;
  } catch (err) {
    if (err instanceof ApiError && err.code === "AI_INVALID_RESPONSE") {
      throw err;
    }
    console.error("[AI PROVIDER ERROR]", err);
    throw ApiError.internal("AI analysis failed. Please try again.", "AI_PROVIDER_ERROR");
  }
}

export async function evaluateInterview(
  qaPairs: { question: string; answer: string }[],
): Promise<InterviewEvaluation> {
  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: evaluationSystemPrompt },
        { content: `Question and answer pairs:\n${qaPairs
        .map(
          (pair, index) =>
            `${index + 1}. Question: ${pair.question}\nAnswer: ${pair.answer}`,
        )
        .join("\n\n")}`, role: "user" },
      ],
    });
    const parsed = parseJsonResponse(completion.choices[0]?.message.content);
    const validated = interviewEvaluationSchema.safeParse(parsed);
    if (!validated.success) {
      throw ApiError.internal("AI returned an invalid response", "AI_INVALID_RESPONSE");
    }
    return validated.data;
  } catch (err) {
    if (err instanceof ApiError && err.code === "AI_INVALID_RESPONSE") {
      throw err;
    }
    console.error("[AI PROVIDER ERROR]", err);
    throw ApiError.internal("AI analysis failed. Please try again.", "AI_PROVIDER_ERROR");
  }
}