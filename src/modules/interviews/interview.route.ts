import { Router } from "express";
import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { interviewController } from "./interview.controller";
import {
	interviewIdParamSchema,
	startInterviewSchema,
	submitAnswerSchema,
} from "./interview.schema";

const router = Router();

router.post(
	"/",
	requireAuth,
	validate(startInterviewSchema),
	interviewController.start,
);
router.post(
	"/:id/answer",
	requireAuth,
	validate(interviewIdParamSchema),
	validate(submitAnswerSchema),
	interviewController.answer,
);
router.get(
	"/:id/result",
	requireAuth,
	validate(interviewIdParamSchema),
	interviewController.getResult,
);
router.get("/", requireAuth, interviewController.listMine);

export default router;
