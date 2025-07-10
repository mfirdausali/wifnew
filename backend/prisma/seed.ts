import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default users for each role
  const users = [
    {
      email: 'admin@localhost',
      username: 'admin',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'Administration'
    },
    {
      email: 'sales@localhost',
      username: 'sales',
      password: 'sales123',
      firstName: 'Sales',
      lastName: 'User',
      role: Role.SALES,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'Sales'
    },
    {
      email: 'finance@localhost',
      username: 'finance',
      password: 'finance123',
      firstName: 'Finance',
      lastName: 'User',
      role: Role.FINANCE,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'Finance'
    },
    {
      email: 'operations@localhost',
      username: 'operations',
      password: 'operations123',
      firstName: 'Operations',
      lastName: 'User',
      role: Role.OPERATIONS,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'Operations'
    }
  ];

  // Hash passwords and create users
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: hashedPassword
      }
    });

    console.log(`✅ Created/Updated user: ${user.email} (${user.role})`);
  }

  // Create sample notifications for admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@localhost' }
  });

  if (adminUser) {
    await prisma.notification.createMany({
      data: [
        {
          userId: adminUser.id,
          title: 'Welcome to the Multi-Role Auth System',
          message: 'Your admin account has been successfully created.',
          type: 'success'
        },
        {
          userId: adminUser.id,
          title: 'Security Reminder',
          message: 'Please change your default password after first login.',
          type: 'warning'
        }
      ]
    });

    console.log('✅ Created sample notifications for admin user');
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });