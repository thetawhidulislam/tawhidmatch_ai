import fs from "fs";
import { PDFParse } from "pdf-parse";
import { prisma } from "@/database/prisma";
import { analyzeCvText } from "@/services/ai/cv-analysis.service";
import { ApiError } from "@/utils/ApiError";

export const resumeService = {
  async uploadResume(userId: string, file: Express.Multer.File) {
    let parsedText: string | null = null;

    try {
      const buffer = fs.readFileSync(file.path);
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      parsedText = result.text?.trim() || null;
      await parser.destroy();
    } catch (err) {
      console.error("[PDF PARSE ERROR]", err);
    }

    await prisma.resume.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const resume = await prisma.resume.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl: file.path,
        fileSize: file.size,
        parsedText,
        isActive: true,
      },
    });

    return resume;
  },

  async listResumes(userId: string) {
    return prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getResumeById(userId: string, resumeId: string) {
    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });

    if (!resume) throw ApiError.notFound("Resume not found");
    if (resume.userId !== userId) {
      throw ApiError.forbidden("You don't have access to this resume");
    }

    return resume;
  },

  async analyzeResume(userId: string, resumeId: string) {
    const resume = await this.getResumeById(userId, resumeId);
    if (!resume.parsedText?.trim()) {
      throw ApiError.badRequest(
        "This resume has no extracted text to analyze",
        "NO_PARSED_TEXT",
      );
    }

    const analysis = await analyzeCvText(resume.parsedText);
    return prisma.aIAnalysis.upsert({
      where: { resumeId },
      create: {
        resumeId,
        score: analysis.score,
        level: analysis.level,
        skills: analysis.skills,
        strengths: analysis.strengths,
        missingSkills: analysis.missingSkills,
        recommendations: analysis.recommendations,
      },
      update: {
        score: analysis.score,
        level: analysis.level,
        skills: analysis.skills,
        strengths: analysis.strengths,
        missingSkills: analysis.missingSkills,
        recommendations: analysis.recommendations,
      },
      include: {
        resume: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  },

  async deleteResume(userId: string, resumeId: string) {
    const resume = await this.getResumeById(userId, resumeId);

    try {
      if (fs.existsSync(resume.fileUrl)) {
        fs.unlinkSync(resume.fileUrl);
      }
    } catch (err) {
      console.error("[RESUME FILE DELETE ERROR]", err);
    }

    await prisma.resume.delete({ where: { id: resumeId } });
    return { id: resumeId };
  },
};
