import { Router, Request, Response } from "express";
import { upload } from "../middleware/upload";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../utils/HttpError";

const router = Router();

router.post("/image", requireAuth, upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) throw new HttpError(400, "No file uploaded");
  const publicUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({
    url: publicUrl,
    filename: req.file.filename,
    size: req.file.size,
    mime: req.file.mimetype,
  });
});

export default router;
