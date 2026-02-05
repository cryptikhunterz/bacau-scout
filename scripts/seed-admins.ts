import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("BacauScout2026!", 12);

  const admins = [
    { email: "crypwalk@bacauscout.com", name: "Crypwalk", role: "admin" },
    { email: "flavius@bacauscout.com", name: "Flavius", role: "admin" },
  ];

  for (const admin of admins) {
    const existing = await prisma.scout.findUnique({
      where: { email: admin.email },
    });

    if (existing) {
      console.log(`⏭️  ${admin.name} already exists, skipping`);
      continue;
    }

    await prisma.scout.create({
      data: {
        email: admin.email,
        password,
        name: admin.name,
        role: admin.role,
      },
    });

    console.log(`✅ Created admin: ${admin.name} (${admin.email})`);
  }

  console.log("\n🔑 Temporary password: BacauScout2026!");
  console.log("⚠️  Change passwords after first login!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
