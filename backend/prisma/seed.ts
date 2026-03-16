import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default school
  const school = await prisma.school.upsert({
    where: { registrationNo: 'SCH001' },
    update: {},
    create: {
      name: 'Amani Demo School',
      registrationNo: 'SCH001',
      address: 'Kampala, Uganda',
      phone: '+256700000000',
      email: 'info@amani.ug',
      motto: 'Education for Excellence',
      currency: 'UGX',
      timezone: 'Africa/Kampala',
    },
  });

  console.log('Created school:', school.name);

  // Create default admin user with school association
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@amani.ug' },
    update: {},
    create: {
      email: 'admin@amani.ug',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+256700000000',
      role: 'SCHOOL_OWNER',
      schoolId: school.id,
      isActive: true,
    },
  });

  console.log('Created admin user:', admin.email);
  console.log('Password: admin123');
  console.log('School: ' + school.name);

  // Get all schools
  const schools = await prisma.school.findMany();
  console.log('Found schools:', schools.length);

  // Create default classes (Primary 1 to Senior 6) for all schools
  const classLevels = [
    { name: 'Primary One', level: 1 },
    { name: 'Primary Two', level: 2 },
    { name: 'Primary Three', level: 3 },
    { name: 'Primary Four', level: 4 },
    { name: 'Primary Five', level: 5 },
    { name: 'Primary Six', level: 6 },
    { name: 'Primary Seven', level: 7 },
    { name: 'Senior One', level: 8 },
    { name: 'Senior Two', level: 9 },
    { name: 'Senior Three', level: 10 },
    { name: 'Senior Four', level: 11 },
    { name: 'Senior Five', level: 12 },
    { name: 'Senior Six', level: 13 },
  ];

  for (const s of schools) {
    for (const cls of classLevels) {
      const classId = `${s.id}-${cls.name}`;
      await prisma.class.upsert({
        where: { id: classId },
        update: {},
        create: {
          id: classId,
          name: cls.name,
          level: cls.level,
          schoolId: s.id,
        },
      });
    }
    console.log(`Created classes for school: ${s.name}`);
  }

  console.log('Created classes:', classLevels.map(c => c.name).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
