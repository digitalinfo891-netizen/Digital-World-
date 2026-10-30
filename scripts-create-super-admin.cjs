/* eslint @typescript-eslint/no-require-imports: "off" */
require("dotenv/config");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const name = (process.env.SUPER_ADMIN_NAME || "").trim();
  const email = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || "";

  if (name.length < 2) throw new Error("Name must be at least 2 characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email address.");
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error("Password must be 8-128 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("This email already exists. No account was changed.");

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "SUPER_ADMIN"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  console.log("\nSuper Admin created successfully:");
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((error) => {
    console.error("\nCreation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
