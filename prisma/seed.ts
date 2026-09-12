import { PrismaClient } from "@prisma/client";
import { ensureSeeded } from "../src/lib/data";

const prisma = new PrismaClient();

async function main() {
  await ensureSeeded();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
