/**
 * AstraMile seed — bootstraps the admin user only.
 *
 * Behaviour:
 *   1. Always upserts the admin user (so creds can be recovered by re-running).
 *   2. All site content (rockets, missions, team, launches, news, blog, gallery,
 *      technology, about) is managed exclusively through the admin panel.
 *
 * Usage:
 *   dev:        npm run seed
 *   production: npm run build && npm run seed:prod
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

const SEED_ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? "admin@astramile.local").toLowerCase();
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "AstraMile Admin";

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log("[seed]", ...args);
}

async function seedAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
  const existing = await prisma.admin.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
  const isFirstRun = !existing;

  await prisma.admin.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    create: {
      email: SEED_ADMIN_EMAIL,
      passwordHash,
      name: SEED_ADMIN_NAME,
      role: Role.SUPER_ADMIN,
    },
    update: {
      name: SEED_ADMIN_NAME,
      role: Role.SUPER_ADMIN,
      isActive: true,
      // Only overwrite the password hash if the env var was explicitly set,
      // so production rotated passwords aren't clobbered with the default.
      ...(process.env.SEED_ADMIN_PASSWORD ? { passwordHash } : {}),
    },
  });

  log(`admin ready: ${SEED_ADMIN_EMAIL} ${isFirstRun ? "(created)" : "(already present)"}`);
}

async function main() {
  log(`starting seed (NODE_ENV=${process.env.NODE_ENV ?? "development"})`);
  await seedAdmin();
  log("done.");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error("[seed] failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
