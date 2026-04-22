import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@astramile.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const name = process.env.SEED_ADMIN_NAME ?? "AstraMile Admin";

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.upsert({
    where: { email },
    create: { email, passwordHash, name, role: "SUPER_ADMIN" },
    update: { name, role: "SUPER_ADMIN", isActive: true },
  });
  console.log(`[seed] admin ready: ${admin.email}`);

  // Rockets — from the existing site
  const rockets = [
    {
      slug: "falcon-heavy",
      name: "Falcon Heavy",
      tagline: "World's most powerful operational rocket",
      description:
        "The world's most powerful operational rocket by a factor of two. Capable of lifting the equivalent of a fully loaded 737 jetliner to orbit.",
      heightM: 70,
      weightKg: 1420788,
      payloadKg: 63800,
      successRate: 100,
      launches: 12,
      features: ["27 Merlin engines", "Reusable side boosters", "Payload fairing recovery", "Cross-feed fueling"],
      image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=700&q=80",
      order: 0,
    },
    {
      slug: "starship",
      name: "Starship",
      tagline: "Fully reusable super-heavy launch system",
      description:
        "Fully reusable transportation system designed for crew and cargo to Earth orbit, the Moon, Mars, and beyond.",
      heightM: 120,
      weightKg: 5000000,
      payloadKg: 150000,
      successRate: 85,
      launches: 6,
      features: ["33 Raptor engines", "Full reusability", "Orbital refueling", "Mars colonization capable"],
      image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=700&q=80",
      order: 1,
    },
    {
      slug: "atlas-v",
      name: "Atlas V",
      tagline: "America's most reliable expendable launcher",
      description:
        "America's most reliable expendable launch vehicle delivering critical national security and science payloads.",
      heightM: 58.3,
      weightKg: 590000,
      payloadKg: 18850,
      successRate: 99,
      launches: 99,
      features: ["RD-180 main engine", "Centaur upper stage", "100+ configurations", "98.9% success rate"],
      image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=700&q=80",
      order: 2,
    },
  ];

  for (const r of rockets) {
    await prisma.rocket.upsert({ where: { slug: r.slug }, create: r, update: r });
  }
  console.log(`[seed] ${rockets.length} rockets ready`);

  // Technology
  const techs = [
    {
      slug: "ion-propulsion",
      title: "Ion Propulsion",
      description: "Next-gen engines with record thrust efficiency for deep space exploration missions.",
      icon: "Zap",
      metric: "40%",
      metricLabel: "Efficiency",
      image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=500&q=80",
      order: 0,
    },
    {
      slug: "heat-shields",
      title: "Heat Shields",
      description: "Ablative composites withstanding 3,000°F during hypersonic atmospheric re-entry.",
      icon: "Shield",
      metric: "3000°F",
      metricLabel: "Max Temp",
      image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=500&q=80",
      order: 1,
    },
    {
      slug: "reusable-boosters",
      title: "Reusable Boosters",
      description: "Autonomous propulsive landing technology reducing launch costs by 70%.",
      icon: "RotateCcw",
      metric: "70%",
      metricLabel: "Cost Saved",
      image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=500&q=80",
      order: 2,
    },
  ];

  for (const t of techs) {
    await prisma.technology.upsert({ where: { slug: t.slug }, create: t, update: t });
  }
  console.log(`[seed] ${techs.length} technologies ready`);

  // News
  const news = [
    {
      slug: "starship-completes-first-orbital-flight",
      title: "Starship Completes First Orbital Flight",
      category: "Milestone",
      excerpt: "Starship reaches orbit for the first time — a historic moment for spaceflight.",
      body: "Starship reached orbital velocity for the first time today…",
      coverImage: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1200&q=80",
      publishedAt: new Date("2026-03-15"),
    },
    {
      slug: "mars-sample-return-timeline-announced",
      title: "Mars Sample Return Timeline Announced",
      category: "Mars",
      excerpt: "A fresh plan to bring Martian samples back to Earth.",
      body: "The agency announced a revised timeline…",
      coverImage: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&q=80",
      publishedAt: new Date("2026-03-10"),
    },
    {
      slug: "lunar-gateway-module-launched",
      title: "Lunar Gateway Module Launched",
      category: "Moon",
      excerpt: "The first Gateway element is on its way to cislunar orbit.",
      body: "The module lifted off without incident…",
      coverImage: "https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?w=1200&q=80",
      publishedAt: new Date("2026-02-28"),
    },
  ];

  for (const n of news) {
    await prisma.newsArticle.upsert({ where: { slug: n.slug }, create: n, update: n });
  }
  console.log(`[seed] ${news.length} news articles ready`);

  // Site stats
  const stats = [
    { label: "Success Rate", value: "99.2%", order: 0 },
    { label: "Missions", value: "150+", order: 1 },
    { label: "Countries", value: "45", order: 2 },
    { label: "Years in Space", value: "20+", order: 3 },
  ];
  await prisma.siteStat.deleteMany();
  await prisma.siteStat.createMany({ data: stats });
  console.log(`[seed] ${stats.length} site stats ready`);

  // About page
  await prisma.aboutContent.upsert({
    where: { key: "default" },
    create: {
      key: "default",
      headline: "Pushing the boundaries of space exploration",
      body:
        "From launching cutting-edge satellites to planning humanity's first permanent settlements beyond Earth, we are dedicated to unlocking the mysteries of the cosmos.",
      mission:
        "Become a multi-planetary species through safe, sustainable, and frequent access to space.",
      vision: "Beyond Infinity — exploration without limits.",
      heroImage: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&q=80",
      stats: [
        { label: "Success Rate", value: "99.2%" },
        { label: "Missions", value: "150+" },
        { label: "Countries", value: "45" },
      ],
    },
    update: {},
  });
  console.log(`[seed] about page ready`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
