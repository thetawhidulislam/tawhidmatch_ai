import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { ApiError } from "@/utils/ApiError";
import { resumeController } from "./resume.controller";
import { resumeIdParamSchema } from "./resume.schema";
import { resumeUpload } from "./resume.upload";

const router = Router();

function uploadSingle(req: Request, res: Response, next: NextFunction) {
  resumeUpload.single("resume")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(ApiError.badRequest("File too large. Max size is 5MB.", "FILE_TOO_LARGE"));
      }
      return next(ApiError.badRequest(err.message, "UPLOAD_ERROR"));
    }
    if (err) return next(err);
    next();
  });
}

router.post("/", requireAuth, uploadSingle, resumeController.upload);
router.get("/", requireAuth, resumeController.list);
router.get("/:id", requireAuth, validate(resumeIdParamSchema), resumeController.getOne);
router.delete("/:id", requireAuth, validate(resumeIdParamSchema), resumeController.remove);

export default router;