import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@amani.ug' },
    select: { schoolId: true }
  });

  if (!user || !user.schoolId) return;
  const mySchoolId = user.schoolId;

  // Sync Terms
  const termsResult = await prisma.academicTerm.updateMany({
    data: { schoolId: mySchoolId }
  });
  console.log(`Synced ${termsResult.count} academic terms.`);

  // Sync Streams (if any)
  const streamsResult = await prisma.stream.updateMany({
    data: { schoolId: mySchoolId }
  });
  console.log(`Synced ${streamsResult.count} streams.`);

  // Sync Subjects
  const subjectsResult = await prisma.subject.updateMany({
    data: { schoolId: mySchoolId }
  });
  console.log(`Synced ${subjectsResult.count} subjects.`);
}

main().finally(() => prisma.$disconnect());
