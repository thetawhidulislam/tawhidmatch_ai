import { prisma } from "@/database/prisma";
import { evaluateInterview, generateInterviewQuestions } from "@/services/ai/interview.service";
import { ApiError } from "@/utils/ApiError";
import { SubmitAnswerInput } from "./interview.schema";

const questionSelect = {
  id: true,
  questionText: true,
  order: true,
} as const;

const questionWithAnswerInclude = {
  questions: {
    include: { answer: true },
    orderBy: { order: "asc" as const },
  },
} as const;

export const interviewService = {
  async startInterview(userId: string, jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true, description: true, skills: true },
    });
    if (!job) throw ApiError.notFound("Job not found");

    const questions = await generateInterviewQuestions(job);
    return prisma.interview.create({
      data: {
        userId,
        jobId,
        status: "IN_PROGRESS",
        strengths: [],
        improvements: [],
        questions: {
          create: questions.map((questionText, order) => ({ questionText, order })),
        },
      },
      include: { questions: { select: questionSelect, orderBy: { order: "asc" } } },
    });
  },

  async submitAnswer(userId: string, interviewId: string, data: SubmitAnswerInput) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: questionWithAnswerInclude,
    });
    if (!interview) throw ApiError.notFound("Interview not found");
    if (interview.userId !== userId) {
      throw ApiError.forbidden("You don't have access to this interview");
    }
    if (interview.status === "COMPLETED") {
      throw ApiError.badRequest("This interview is already completed");
    }

    const question = interview.questions.find(
      (interviewQuestion) => interviewQuestion.id === data.questionId,
    );
    if (!question) throw ApiError.notFound("Question not found in this interview");
    if (question.answer) {
      throw ApiError.conflict("This question has already been answered");
    }

    await prisma.interviewAnswer.create({
      data: {
        questionId: data.questionId,
        answerText: data.answerText,
      },
    });

    const updatedInterview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: questionWithAnswerInclude,
    });
    if (!updatedInterview) throw ApiError.notFound("Interview not found");

    const allAnswered = updatedInterview.questions.every(
      (interviewQuestion) => interviewQuestion.answer !== null,
    );
    if (!allAnswered) {
      return {
        completed: false,
        message: "Answer saved. Continue with the next question.",
      };
    }

    const evaluation = await evaluateInterview(
      updatedInterview.questions.map((interviewQuestion) => ({
        question: interviewQuestion.questionText,
        answer: interviewQuestion.answer!.answerText,
      })),
    );
    const completedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: "COMPLETED",
        technicalScore: Math.round(evaluation.technicalScore),
        communicationScore: Math.round(evaluation.communicationScore),
        problemSolvingScore: Math.round(evaluation.problemSolvingScore),
        confidenceScore: Math.round(evaluation.confidenceScore),
        overallScore: Math.round(evaluation.overallScore),
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      },
      include: questionWithAnswerInclude,
    });

    return { completed: true, evaluation: completedInterview };
  },

  async getInterviewResult(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: questionWithAnswerInclude,
    });
    if (!interview) throw ApiError.notFound("Interview not found");
    if (interview.userId !== userId) {
      throw ApiError.forbidden("You don't have access to this interview");
    }
    if (interview.status !== "COMPLETED") {
      throw ApiError.badRequest("Interview is still in progress", "INTERVIEW_NOT_COMPLETED");
    }

    return interview;
  },

  async listMyInterviews(userId: string) {
    return prisma.interview.findMany({
      where: { userId },
      select: {
        id: true,
        jobId: true,
        status: true,
        overallScore: true,
        createdAt: true,
        job: { select: { title: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};