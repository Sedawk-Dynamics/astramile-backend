/**
 * AstraMile seed — one-time initial data for development AND production.
 *
 * Behaviour:
 *   1. Always upserts the admin user (so you can recover lost creds by re-running).
 *   2. Seeds the demo catalog (rockets, missions, crew, launches, news, gallery,
 *      technology, stats, about) only on the *first* run. After that, existing
 *      rows are preserved — edits made through the admin UI won't be overwritten.
 *   3. Override the one-time guard with SEED_FORCE=true to force a re-seed
 *      (useful for repopulating a reset DB).
 *
 * Usage:
 *   dev:        npm run seed            (via ts-node)
 *   production: npm run build && npm run seed:prod    (runs compiled dist/)
 */

import { PrismaClient, LaunchStatus, MissionStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

const SEED_ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? "admin@astramile.local").toLowerCase();
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "AstraMile Admin";
const FORCE = process.env.SEED_FORCE === "true";

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log("[seed]", ...args);
}

async function seedAdmin(): Promise<boolean> {
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
      // Only overwrite the password hash if the env var was explicitly set.
      // In production, don't clobber a rotated password with the default.
      ...(process.env.SEED_ADMIN_PASSWORD ? { passwordHash } : {}),
    },
  });

  log(`admin ready: ${SEED_ADMIN_EMAIL} ${isFirstRun ? "(created)" : "(already present)"}`);
  return isFirstRun;
}

// ──────────────────────────────────────────────────────────────────────────
// Demo content
// ──────────────────────────────────────────────────────────────────────────

const ROCKETS = [
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
  {
    slug: "ariane-5",
    name: "Ariane 5",
    tagline: "Europe's flagship heavy-lift launcher",
    description:
      "Europe's flagship heavy-lift launcher. Deployed the James Webb Space Telescope on its historic mission.",
    heightM: 52,
    weightKg: 780000,
    payloadKg: 21000,
    successRate: 96,
    launches: 117,
    features: ["Vulcain 2 engine", "Solid rocket boosters", "Dual-payload adapter", "GTO specialist"],
    image: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=700&q=80",
    order: 3,
  },
  {
    slug: "pslv",
    name: "PSLV",
    tagline: "India's workhorse launch vehicle",
    description:
      "India's workhorse rocket. Holds the world record for deploying 104 satellites in a single mission.",
    heightM: 44,
    weightKg: 320000,
    payloadKg: 3800,
    successRate: 94,
    launches: 59,
    features: ["4 stage design", "Solid + liquid stages", "Record 104 satellites", "Cost-effective platform"],
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=700&q=80",
    order: 4,
  },
  {
    slug: "gslv-mk-iii",
    name: "GSLV Mk III",
    tagline: "Heavy-lift vehicle with indigenous cryogenic stage",
    description:
      "India's heavy-lift vehicle with indigenous cryogenic upper stage. Launched Chandrayaan missions.",
    heightM: 43.4,
    weightKg: 640000,
    payloadKg: 10000,
    successRate: 100,
    launches: 7,
    features: ["S200 solid boosters", "CE-20 cryo engine", "4-ton GTO capacity", "Human-rated variant"],
    image: "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=700&q=80",
    order: 5,
  },
];

const MISSIONS = [
  {
    slug: "artemis-iii",
    name: "Artemis III - Lunar Landing",
    summary: "First crewed lunar landing in over 50 years.",
    description:
      "Astronauts will explore permanently shadowed craters at the lunar south pole searching for water ice deposits.",
    destination: "Lunar South Pole",
    status: MissionStatus.COMPLETED,
    startDate: new Date("2024-11-01"),
    image: "https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?w=600&q=80",
    order: 0,
  },
  {
    slug: "mars-rover-deployment",
    name: "Mars Rover Deployment",
    summary: "Next-gen AI rover searching for ancient biosignatures.",
    description:
      "Advanced autonomous rover exploring dried river deltas in Jezero Crater for traces of ancient microbial life.",
    destination: "Jezero Crater, Mars",
    status: MissionStatus.ACTIVE,
    startDate: new Date("2025-07-01"),
    image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=600&q=80",
    order: 1,
  },
  {
    slug: "starlink-mega-constellation",
    name: "Starlink Mega-Constellation",
    summary: "Deploying 60 V2 communication satellites to LEO.",
    description:
      "Providing gigabit internet coverage to underserved regions worldwide with a next-gen satellite bus.",
    destination: "Low Earth Orbit",
    status: MissionStatus.PLANNED,
    startDate: new Date("2026-03-01"),
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=600&q=80",
    order: 2,
  },
  {
    slug: "iss-resupply-crs-30",
    name: "ISS Resupply CRS-30",
    summary: "Critical resupply to the International Space Station.",
    description:
      "Delivering 3,600 kg of experiments, crew provisions, and station hardware upgrades to the orbiting lab.",
    destination: "International Space Station",
    status: MissionStatus.PLANNED,
    startDate: new Date("2026-09-01"),
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80",
    order: 3,
  },
  {
    slug: "europa-clipper",
    name: "Europa Clipper",
    summary: "Investigating Europa's subsurface ocean.",
    description:
      "Fifty close flybys analyze ice shell composition and potential habitability of Jupiter's ocean moon.",
    destination: "Jupiter – Europa",
    status: MissionStatus.PLANNED,
    startDate: new Date("2027-01-01"),
    image: "https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=600&q=80",
    order: 4,
  },
  {
    slug: "solar-observatory-ii",
    name: "Solar Observatory II",
    summary: "Studying coronal mass ejections at unprecedented resolution.",
    description:
      "Advanced observatory at Sun-Earth L1 improving space weather forecasting for the next generation.",
    destination: "Sun-Earth L1 Point",
    status: MissionStatus.PLANNED,
    startDate: new Date("2027-06-01"),
    image: "https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=600&q=80",
    order: 5,
  },
  {
    slug: "titan-dragonfly",
    name: "Titan Dragonfly",
    summary: "Rotorcraft lander exploring Titan's prebiotic chemistry.",
    description:
      "Sampling diverse surface environments on Saturn's largest moon, hunting for complex organic molecules.",
    destination: "Saturn – Titan",
    status: MissionStatus.PLANNED,
    startDate: new Date("2027-12-01"),
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
    order: 6,
  },
  {
    slug: "mars-cargo-delivery",
    name: "Mars Cargo Delivery",
    summary: "First uncrewed Starship cargo mission to the Martian surface.",
    description:
      "Pre-positioning habitat modules and supplies at Arcadia Planitia to enable future crewed missions.",
    destination: "Arcadia Planitia, Mars",
    status: MissionStatus.PLANNED,
    startDate: new Date("2028-03-01"),
    image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=600&q=80",
    order: 7,
  },
];

const CREW = [
  { slug: "sarah-chen", name: "Cmdr. Sarah Chen", role: "Mission Commander", nationality: "United States", bio: "Led three lunar missions. Holds the record for longest continuous station residency. Zero-gravity operations expert.", photo: "https://images.unsplash.com/photo-1559548331-f9cb98001426?w=500&q=80", order: 0 },
  { slug: "marcus-webb", name: "Dr. Marcus Webb", role: "Flight Engineer", nationality: "United Kingdom", bio: "Propulsion specialist and orbital mechanics expert. Key contributor to next-gen rocket engine development.", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80", order: 1 },
  { slug: "aisha-patel", name: "Lt. Aisha Patel", role: "Payload Specialist", nationality: "India", bio: "Satellite deployment and station assembly expert. Over 200 hours of EVA across multiple mission profiles.", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&q=80", order: 2 },
  { slug: "james-kowalski", name: "Dr. James Kowalski", role: "Science Officer", nationality: "United States", bio: "Astrobiology researcher studying Mars habitability. Led breakthrough ISS experiments on microgravity biology.", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80", order: 3 },
  { slug: "elena-volkov", name: "Capt. Elena Volkov", role: "Pilot", nationality: "Russia", bio: "Veteran shuttle pilot. Orbital docking maneuver expert. Trained 50+ next-generation astronauts for deep space.", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80", order: 4 },
  { slug: "kenji-tanaka", name: "Dr. Kenji Tanaka", role: "Medical Officer", nationality: "Japan", bio: "Space medicine specialist for long-duration crew health. Pioneer in developing telemedicine protocols from orbit.", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&q=80", order: 5 },
];

const LAUNCHES: Array<{
  slug: string;
  name: string;
  description: string;
  scheduledAt: Date;
  launchSite: string;
  status: LaunchStatus;
  image: string;
  rocketSlug: string;
  missionSlug?: string;
  order: number;
}> = [
  { slug: "artemis-iv", name: "Artemis IV", description: "Deliver I-HAB module to Lunar Gateway", scheduledAt: new Date("2026-06-15T14:00:00Z"), launchSite: "Kennedy Space Center, FL", status: LaunchStatus.UPCOMING, image: "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=600&q=80", rocketSlug: "gslv-mk-iii", order: 0 },
  { slug: "starlink-group-12", name: "Starlink Group 12", description: "Deploy 60 V2 mini satellites to LEO", scheduledAt: new Date("2026-05-20T09:30:00Z"), launchSite: "Cape Canaveral, FL", status: LaunchStatus.UPCOMING, image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=600&q=80", rocketSlug: "falcon-heavy", missionSlug: "starlink-mega-constellation", order: 1 },
  { slug: "europa-clipper-launch", name: "Europa Clipper Launch", description: "Investigate Europa's ocean habitability", scheduledAt: new Date("2026-08-01T16:00:00Z"), launchSite: "Vandenberg SFB, CA", status: LaunchStatus.UPCOMING, image: "https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=600&q=80", rocketSlug: "falcon-heavy", missionSlug: "europa-clipper", order: 2 },
  { slug: "chandrayaan-4", name: "Chandrayaan-4", description: "Lunar sample return from the south pole", scheduledAt: new Date("2026-10-10T06:00:00Z"), launchSite: "Satish Dhawan Space Centre", status: LaunchStatus.UPCOMING, image: "https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?w=600&q=80", rocketSlug: "gslv-mk-iii", order: 3 },
  { slug: "mars-express-ii", name: "Mars Express II", description: "Mars orbit insertion for relay communications", scheduledAt: new Date("2026-12-01T12:00:00Z"), launchSite: "Kourou, French Guiana", status: LaunchStatus.UPCOMING, image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=600&q=80", rocketSlug: "ariane-5", order: 4 },
  { slug: "axiom-station-alpha", name: "Axiom Station Alpha", description: "Commercial station module deployment", scheduledAt: new Date("2027-02-15T10:00:00Z"), launchSite: "Cape Canaveral, FL", status: LaunchStatus.UPCOMING, image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80", rocketSlug: "starship", order: 5 },
];

const NEWS = [
  { slug: "starship-completes-first-orbital-flight", title: "Starship Completes First Orbital Flight", category: "Milestone", excerpt: "Starship successfully completed its first full orbital flight, marking a major milestone in reusable heavy-lift rocket development.", body: "The vehicle reached orbit after a flawless ascent and performed a controlled deorbit burn, ushering in a new era of fully-reusable spaceflight.", coverImage: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1200&q=80", publishedAt: new Date("2026-03-15") },
  { slug: "mars-sample-return-timeline-announced", title: "Mars Sample Return Timeline Announced", category: "Mars", excerpt: "NASA finalized plans for bringing Martian soil samples to Earth by 2033, representing the first round-trip mission to another planet.", body: "The revised timeline leverages commercial launch partners and a retooled ascent vehicle to reduce mission complexity and cost.", coverImage: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&q=80", publishedAt: new Date("2026-03-10") },
  { slug: "lunar-gateway-module-launched", title: "Lunar Gateway Module Launched Successfully", category: "Moon", excerpt: "The latest habitation module for the Lunar Gateway was launched, expanding capacity for long-duration cislunar operations.", body: "The module lifted off without incident and is on course to rendezvous with the orbiting platform in two weeks.", coverImage: "https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?w=1200&q=80", publishedAt: new Date("2026-02-28") },
  { slug: "ion-propulsion-breakthrough", title: "Breakthrough in Ion Propulsion Efficiency", category: "Technology", excerpt: "Researchers achieve record thrust efficiency with new ion drive design, potentially halving travel time to Mars.", body: "The new design uses krypton as a propellant and a novel magnetic confinement scheme to achieve higher ion velocities.", coverImage: "https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=1200&q=80", publishedAt: new Date("2026-02-20") },
  { slug: "private-spacewalk-altitude-record", title: "Private Spacewalk Sets Altitude Record", category: "Commercial", excerpt: "A commercial crew performed the first private EVA at 700 km, setting a new record for civilian space activity.", body: "The mission tested a new suit architecture designed for longer-duration operations outside commercial spacecraft.", coverImage: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=1200&q=80", publishedAt: new Date("2026-02-15") },
  { slug: "asteroid-mining-probe-target", title: "Asteroid Mining Probe Reaches Target", category: "Mining", excerpt: "Prospector-1 arrived at asteroid 2024-QR7, beginning spectroscopic analysis of platinum-group metal deposits.", body: "Over the next six months the probe will map the asteroid surface and measure resource concentrations.", coverImage: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=1200&q=80", publishedAt: new Date("2026-02-05") },
  { slug: "horizon-telescope-hidden-galaxies", title: "New Space Telescope Reveals Hidden Galaxies", category: "Discovery", excerpt: "The Horizon telescope captured unprecedented images of galaxies hidden behind dust clouds in deep space.", body: "Infrared observations are revealing structure in regions long obscured to optical wavelengths.", coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80", publishedAt: new Date("2026-01-28") },
  { slug: "raptor-3-full-thrust", title: "Raptor 3 Engine Achieves Full Thrust", category: "Technology", excerpt: "The next-generation Raptor 3 engine completed its full-duration test firing, generating 280 tons of thrust.", body: "Raptor 3 simplifies the previous design while delivering higher performance and improved reusability.", coverImage: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=1200&q=80", publishedAt: new Date("2026-01-20") },
  { slug: "gaganyaan-crew-selection", title: "India's Gaganyaan Crew Selection Complete", category: "Crewed", excerpt: "ISRO announced the final crew of four astronauts for India's first crewed space mission, launching in 2027.", body: "The crew has begun advanced training, including centrifuge runs and pressurised-suit operations.", coverImage: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80", publishedAt: new Date("2026-01-12") },
];

const GALLERY = [
  { title: "Rocket Launch at Sunset", category: "Rockets", image: "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=800&q=80", caption: "Twilight ascent over the pad", order: 0 },
  { title: "International Space Station", category: "Stations", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80", caption: null, order: 1 },
  { title: "Earth from Orbit", category: "Planets", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80", caption: null, order: 2 },
  { title: "Astronaut in Deep Space", category: "Astronauts", image: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=600&q=80", caption: null, order: 3 },
  { title: "Mars Surface Panorama", category: "Planets", image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=600&q=80", caption: null, order: 4 },
  { title: "Satellite Deployment", category: "Stations", image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=600&q=80", caption: null, order: 5 },
  { title: "Nebula Deep Field", category: "Deep Space", image: "https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=800&q=80", caption: null, order: 6 },
  { title: "Lunar Surface", category: "Planets", image: "https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?w=600&q=80", caption: null, order: 7 },
  { title: "Rocket Engine Test Fire", category: "Rockets", image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=600&q=80", caption: null, order: 8 },
  { title: "Starship on Pad", category: "Rockets", image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=600&q=80", caption: null, order: 9 },
  { title: "Solar Corona", category: "Deep Space", image: "https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=600&q=80", caption: null, order: 10 },
  { title: "Spacewalk EVA", category: "Astronauts", image: "https://images.unsplash.com/photo-1559548331-f9cb98001426?w=600&q=80", caption: null, order: 11 },
  { title: "Mission Commander Portrait", category: "Astronauts", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80", caption: null, order: 12 },
  { title: "Payload Specialist", category: "Astronauts", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80", caption: null, order: 13 },
];

const TECHNOLOGY = [
  { slug: "methane-propulsion", title: "Methane Propulsion", description: "Advanced liquid methane/oxygen engines producing cleaner burns with higher specific impulse than traditional RP-1 kerosene systems.", icon: "Fuel", metric: "40%", metricLabel: "Efficiency Gain", image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=500&q=80", order: 0 },
  { slug: "star-tracker-nav", title: "Star-Tracker Nav", description: "Celestial navigation systems cross-referencing star catalogs for centimeter-level orbital insertion accuracy.", icon: "Navigation", metric: "0.01m", metricLabel: "Precision", image: "https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=500&q=80", order: 1 },
  { slug: "ai-flight-computer", title: "AI Flight Computer", description: "Machine learning flight computers performing real-time trajectory optimization and autonomous hazard avoidance.", icon: "Brain", metric: "200ms", metricLabel: "Response", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80", order: 2 },
  { slug: "thermal-protection", title: "Thermal Protection", description: "Ablative ceramic composite tiles with embedded cooling channels for hypersonic atmospheric re-entry.", icon: "ShieldCheck", metric: "3000F", metricLabel: "Max Temp", image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=500&q=80", order: 3 },
  { slug: "booster-recovery", title: "Booster Recovery", description: "Propulsive landing with grid fin guidance enabling autonomous drone-ship and pad recovery in 8+ sea states.", icon: "RotateCcw", metric: "70%", metricLabel: "Cost Saving", image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=500&q=80", order: 4 },
  { slug: "precision-landing", title: "Precision Landing", description: "Throttleable engines and cold-gas thrusters achieving sub-meter landing precision on moving platforms.", icon: "ArrowDownToLine", metric: "<1m", metricLabel: "Accuracy", image: "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=500&q=80", order: 5 },
  { slug: "radiation-hard-electronics", title: "Radiation-Hard Electronics", description: "Custom silicon designed to withstand deep-space radiation environments without performance degradation.", icon: "Cpu", metric: "50krad", metricLabel: "Tolerance", image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=500&q=80", order: 6 },
  { slug: "laser-comms", title: "Laser Comms", description: "Free-space optical communication links providing 100x bandwidth improvement over traditional RF systems.", icon: "Wifi", metric: "10Gbps", metricLabel: "Bandwidth", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&q=80", order: 7 },
  { slug: "solar-electric", title: "Solar Electric Power", description: "Next-generation solar arrays with concentrator optics powering high-thrust ion propulsion systems.", icon: "BatteryCharging", metric: "300kW", metricLabel: "Power Output", image: "https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=500&q=80", order: 8 },
];

const ABOUT = {
  headline: "Making humanity a multi-planetary species",
  body:
    "Our space program stands at the forefront of rocket innovation, pushing the boundaries of what is possible in space exploration. We develop rockets, spacecraft, and the technology needed to realize the dream of living and working in space.",
  mission:
    "With a fleet of proven launch vehicles and a pipeline of next-generation technologies, we serve commercial, government, and scientific customers worldwide. From deploying communication satellites to resupplying the International Space Station, every mission advances our understanding of the cosmos.",
  vision:
    "Looking ahead, our roadmap includes crewed lunar missions, Mars cargo delivery, and ultimately establishing the first permanent human settlement beyond Earth.",
  heroImage: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&q=80",
  stats: [
    { label: "Missions Completed", value: "150+" },
    { label: "Satellites Launched", value: "320+" },
    { label: "Countries Served", value: "45" },
    { label: "Experiments", value: "1200+" },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// Seeding pipeline
// ──────────────────────────────────────────────────────────────────────────

async function seedDemoContent() {
  // Rockets
  const rocketIdBySlug = new Map<string, string>();
  for (const r of ROCKETS) {
    const row = await prisma.rocket.upsert({ where: { slug: r.slug }, create: r, update: r });
    rocketIdBySlug.set(r.slug, row.id);
  }
  log(`rockets: ${ROCKETS.length}`);

  // Missions
  const missionIdBySlug = new Map<string, string>();
  for (const m of MISSIONS) {
    const row = await prisma.mission.upsert({ where: { slug: m.slug }, create: m, update: m });
    missionIdBySlug.set(m.slug, row.id);
  }
  log(`missions: ${MISSIONS.length}`);

  // Crew
  for (const c of CREW) {
    await prisma.crewMember.upsert({ where: { slug: c.slug }, create: c, update: c });
  }
  log(`crew: ${CREW.length}`);

  // Launches (linked to rockets / missions)
  for (const l of LAUNCHES) {
    const { rocketSlug, missionSlug, ...rest } = l;
    const data = {
      ...rest,
      rocketId: rocketIdBySlug.get(rocketSlug) ?? null,
      missionId: missionSlug ? missionIdBySlug.get(missionSlug) ?? null : null,
    };
    await prisma.launch.upsert({ where: { slug: l.slug }, create: data, update: data });
  }
  log(`launches: ${LAUNCHES.length}`);

  // News
  for (const n of NEWS) {
    await prisma.newsArticle.upsert({ where: { slug: n.slug }, create: n, update: n });
  }
  log(`news articles: ${NEWS.length}`);

  // Gallery — no natural unique key, so seed only if empty
  const galleryCount = await prisma.galleryItem.count();
  if (galleryCount === 0) {
    await prisma.galleryItem.createMany({ data: GALLERY });
    log(`gallery items: ${GALLERY.length}`);
  } else {
    log(`gallery already has ${galleryCount} items — skipping demo rows`);
  }

  // Technology
  for (const t of TECHNOLOGY) {
    await prisma.technology.upsert({ where: { slug: t.slug }, create: t, update: t });
  }
  log(`technologies: ${TECHNOLOGY.length}`);

  // About (singleton)
  await prisma.aboutContent.upsert({
    where: { key: "default" },
    create: { key: "default", ...ABOUT },
    update: ABOUT,
  });
  log(`about page ready`);
}

async function main() {
  log(`starting seed (NODE_ENV=${process.env.NODE_ENV ?? "development"}, FORCE=${FORCE})`);

  const isFirstRun = await seedAdmin();

  if (!isFirstRun && !FORCE) {
    log("demo content already seeded (admin exists); skipping.");
    log("use SEED_FORCE=true to re-run demo seeding (upserts existing rows by slug).");
    return;
  }

  if (FORCE) log("SEED_FORCE=true — re-running demo seeding over existing rows");

  await seedDemoContent();
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
