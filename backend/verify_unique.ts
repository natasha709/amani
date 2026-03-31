import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'admin@amani.ug' } });
  if (!user?.schoolId) return;

  const classes = await prisma.class.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { level: 'asc' },
    select: { name: true }
  });

  const terms = await prisma.academicTerm.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { startDate: 'asc' },
    select: { name: true }
  });

  console.log('Final Classes (Unique):', classes.map(c => c.name));
  console.log('Final Terms (Unique):', terms.map(t => t.name));
}

main().finally(() => prisma.$disconnect());
