import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({
    orderBy: { level: 'asc' },
    select: { name: true, level: true }
  });
  console.log('Classes List:');
  console.log(JSON.stringify(classes, null, 2));
}

main().finally(() => prisma.$disconnect());
