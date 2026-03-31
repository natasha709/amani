import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@amani.ug' },
    select: { schoolId: true }
  });

  if (!user || !user.schoolId) {
    console.error('Current user has no schoolId assigned.');
    return;
  }

  const mySchoolId = user.schoolId;
  console.log(`Primary user schoolId identified: ${mySchoolId}`);

  // Find all classes that don't belong to this school
  const classes = await prisma.class.findMany();
  console.log(`Found ${classes.length} classes in total.`);

  const updateResult = await prisma.class.updateMany({
    data: { schoolId: mySchoolId }
  });

  console.log(`Moved ${updateResult.count} classes to schoolId: ${mySchoolId}`);
}

main().finally(() => prisma.$disconnect());
