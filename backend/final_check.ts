import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({
    orderBy: { level: 'asc' },
    select: { name: true, level: true }
  });
  console.log('--- REFINED CLASS LIST ---');
  classes.forEach(c => console.log(`${c.level}: ${c.name}`));

  const terms = await prisma.academicTerm.findMany({
    orderBy: { startDate: 'asc' },
    select: { name: true, startDate: true }
  });
  console.log('\n--- REFINED TERM LIST ---');
  terms.forEach(t => console.log(`${t.name} (${t.startDate})`));
}

main().finally(() => prisma.$disconnect());
