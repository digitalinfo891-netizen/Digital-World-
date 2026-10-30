import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const ROOT_EMAIL = "test@dgr.com";
const RUN_TAG = "20261020";
const EMAIL_PREFIX = `dgr-tree-${RUN_TAG}-`;
const CODE_PREFIX = `DGRT${RUN_TAG}`;
const EXPECTED_USERS = 1092;
const COUNTS = [3, 9, 27, 81, 243, 729];

function loadEnvFiles() {
  // Existing shell environment variables take precedence.
  const files = [
    ".env.local",
    ".env.development.local",
    ".env.production.local",
    ".env",
  ];

  for (const file of files) {
    if (!existsSync(file)) continue;

    const content = readFileSync(file, "utf8").replace(/^\uFEFF/, "");

    for (const line of content.split(/\r?\n/)) {
      const match = line.match(
        /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/
      );

      if (!match || process.env[match[1]] !== undefined) continue;

      let value = match[2];

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      } else {
        value = value.replace(/\s+#.*$/, "");
      }

      process.env[match[1]] = value;
    }
  }
}

async function main() {
  loadEnvFiles();

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL was not found. Check your local environment files."
    );
  }

  const dbUrl = new URL(connectionString);

  if (!["postgres:", "postgresql:"].includes(dbUrl.protocol)) {
    throw new Error("DATABASE_URL is not a PostgreSQL connection URL.");
  }

  const host = dbUrl.hostname;
  const database = decodeURIComponent(dbUrl.pathname.replace(/^\/+/, ""));
  const target = `${host}/${database}`;
  const apply = process.argv.includes("--apply");

  console.log("\n===== DIGITAL ROJGAR REFERRAL SEED =====");
  console.log(`Mode: ${apply ? "APPLY REQUESTED" : "DRY RUN (no writes)"}`);
  console.log(`Database target: ${target}`);
  console.log(`Root account: ${ROOT_EMAIL}`);
  console.log(`New test users: ${EXPECTED_USERS}`);
  console.log(`Referral levels: ${COUNTS.join(" -> ")}`);
  console.log("Payments/rewards/redemptions: NONE");
  console.log("Deletion of existing records: NONE");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    const root = await prisma.user.findUnique({
      where: { email: ROOT_EMAIL },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        referralCode: true,
      },
    });

    if (!root) {
      throw new Error(`Root account ${ROOT_EMAIL} does not exist.`);
    }

    if (!root.isActive) {
      throw new Error("The root account is inactive.");
    }

    if (!root.referralCode) {
      throw new Error(
        "The root account has no referral code. Fix this before seeding."
      );
    }

    const existingTestUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { startsWith: EMAIL_PREFIX } },
          { referralCode: { startsWith: CODE_PREFIX } },
        ],
      },
      select: { id: true, email: true },
    });

    if (existingTestUser) {
      throw new Error(
        `Seed-tagged data already exists (${existingTestUser.email}). ` +
        "Refusing to duplicate or modify test accounts."
      );
    }

    console.log("\nRoot account verified:");
    console.log(`  Name: ${root.name}`);
    console.log(`  Email: ${root.email}`);
    console.log(`  Active: ${root.isActive}`);
    console.log("Existing seed-tagged users: 0");

    if (!apply) {
      console.log("\nDRY RUN PASSED. No records were inserted.");
      console.log("Review the database target above before proceeding.");
      console.log(
        "To insert, set DGR_TEST_PASSWORD and run with --apply."
      );
      return;
    }

    const password = process.env.DGR_TEST_PASSWORD;

    if (!password || password.length < 8) {
      throw new Error(
        "Set DGR_TEST_PASSWORD to a test password of at least 8 characters."
      );
    }

    console.log(`\nTarget to verify: ${target}`);

    if (!process.argv.includes("--confirm-target")) {
      throw new Error("Confirmation missing. Review the target, then rerun with --confirm-target.");
    }

    if (process.argv.includes("--confirm-create-1092") === false) {
      throw new Error("Final confirmation missing. Add --confirm-create-1092 to authorize creating 1092 test users.");
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const generatedCodes = new Set();

    const levels = [];
    let parentIds = [root.id];

    for (let level = 1; level <= COUNTS.length; level++) {
      const levelUsers = [];

      for (let index = 1; index <= COUNTS[level - 1]; index++) {
        let referralCode;

        do {
          referralCode =
            CODE_PREFIX + randomBytes(6).toString("hex").toUpperCase();
        } while (generatedCodes.has(referralCode));

        generatedCodes.add(referralCode);

        const email =
          `${EMAIL_PREFIX}l${level}-${String(index).padStart(3, "0")}` +
          "@example.invalid";

        levelUsers.push({
          id: randomUUID(),
          name: `DGR Test L${level} User ${index}`,
          email,
          passwordHash,
          role: "LEARNER",
          isActive: true,
          referralCode,
          referredById: parentIds[(index - 1) % parentIds.length],
        });
      }

      levels.push(levelUsers);
      parentIds = levelUsers.map((user) => user.id);
    }

    const total = levels.reduce((sum, level) => sum + level.length, 0);

    if (total !== EXPECTED_USERS) {
      throw new Error(`Internal count mismatch: expected ${EXPECTED_USERS}, got ${total}.`);
    }

    console.log("\nCreating referral tree inside one transaction...");

    await prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < levels.length; i++) {
          const result = await tx.user.createMany({
            data: levels[i],
          });

          if (result.count !== levels[i].length) {
            throw new Error(`Level ${i + 1} insert count mismatch.`);
          }

          console.log(`Level ${i + 1}: ${result.count} users inserted.`);
        }
      },
      { maxWait: 15000, timeout: 120000 }
    );

    console.log("\nSUCCESS: referral tree created.");
    console.log(`Root: ${ROOT_EMAIL}`);
    console.log(`New users: ${total}`);
    console.log("No payment or reward records were created.");
    console.log(`Test login password is the value set in DGR_TEST_PASSWORD.`);
    console.log("Email addresses use the reserved example.invalid domain.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nSEED STOPPED:", error.message);
  process.exitCode = 1;
});


