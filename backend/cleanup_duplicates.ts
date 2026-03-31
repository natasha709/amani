import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanClasses() {
  console.log('--- Cleaning Duplicate Classes ---');
  const user = await prisma.user.findFirst({ where: { email: 'admin@amani.ug' } });
  if (!user?.schoolId) return;

  const classes = await prisma.class.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { createdAt: 'asc' }
  });

  const seenNames = new Set();
  const duplicates = [];

  for (const cls of classes) {
    if (seenNames.has(cls.name)) {
      duplicates.push(cls.id);
    } else {
      seenNames.add(cls.name);
    }
  }

  if (duplicates.length > 0) {
    console.log(`Deleting ${duplicates.length} duplicate classes...`);
    // Note: We might want to update students linked to these classes first, 
    // but usually these are fresh duplicates with no children yet.
    // If there are foreign key constraints, this might fail, which is good (safety).
    await prisma.class.deleteMany({
      where: { id: { in: duplicates } }
    });
    console.log('Duplicate classes deleted.');
  } else {
    console.log('No duplicate classes found.');
  }
}

async function cleanTerms() {
  console.log('\n--- Cleaning Duplicate Terms ---');
  const user = await prisma.user.findFirst({ where: { email: 'admin@amani.ug' } });
  if (!user?.schoolId) return;

  const terms = await prisma.academicTerm.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { startDate: 'asc' }
  });

  const seenNames = new Set();
  const duplicates = [];

  for (const term of terms) {
    if (seenNames.has(term.name)) {
      duplicates.push(term.id);
    } else {
      seenNames.add(term.name);
    }
  }

  if (duplicates.length > 0) {
    console.log(`Deleting ${duplicates.length} duplicate terms...`);
    await prisma.academicTerm.deleteMany({
      where: { id: { in: duplicates } }
    });
    console.log('Duplicate terms deleted.');
  } else {
    console.log('No duplicate terms found.');
  }
}

async function main() {
  await cleanClasses();
  await cleanTerms();
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
