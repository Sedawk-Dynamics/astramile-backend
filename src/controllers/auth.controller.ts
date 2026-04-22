import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../utils/jwt";
import { HttpError } from "../utils/HttpError";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  if (!admin || !admin.isActive) throw new HttpError(401, "Invalid credentials");

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid credentials");

  const token = signToken({ sub: admin.id, email: admin.email, role: admin.role });
  res.json({
    token,
    user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Unauthorized");
  const admin = await prisma.admin.findUnique({ where: { id: req.user.sub } });
  if (!admin) throw new HttpError(404, "User not found");
  res.json({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.isActive,
  });
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function changePassword(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Unauthorized");
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { id: req.user.sub } });
  if (!admin) throw new HttpError(404, "User not found");

  const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!ok) throw new HttpError(401, "Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } });
  res.json({ ok: true });
}
