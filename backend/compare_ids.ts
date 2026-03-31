import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@amani.ug' },
    select: { schoolId: true }
  });
  
  const sampleClass = await prisma.class.findFirst({
    select: { name: true, schoolId: true }
  });

  console.log('--- DIAGNOSTICS ---');
  console.log('User School ID: ', user?.schoolId);
  console.log('Class School ID:', sampleClass?.schoolId);
  console.log('Match?         ', user?.schoolId === sampleClass?.schoolId);
}

main().finally(() => prisma.$disconnect());
