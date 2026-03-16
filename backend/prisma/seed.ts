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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
