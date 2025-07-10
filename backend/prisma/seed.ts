import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users for each role
  const users = [
    {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      department: 'Administration',
    },
    {
      email: 'sales@example.com',
      password: hashedPassword,
      firstName: 'Sales',
      lastName: 'Manager',
      role: UserRole.SALES,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      department: 'Sales',
    },
    {
      email: 'finance@example.com',
      password: hashedPassword,
      firstName: 'Finance',
      lastName: 'Director',
      role: UserRole.FINANCE,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      department: 'Finance',
    },
    {
      email: 'operations@example.com',
      password: hashedPassword,
      firstName: 'Operations',
      lastName: 'Manager',
      role: UserRole.OPERATIONS,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      department: 'Operations',
    },
  ];

  // Create users
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`✅ Created/Updated user: ${user.email} with role: ${user.role}`);
  }

  // Create sample customers
  const customers = [
    {
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1234567890',
      company: 'Acme Corporation',
      address: '123 Business Street',
      city: 'New York',
      country: 'USA',
    },
    {
      name: 'Global Tech Solutions',
      email: 'info@globaltech.com',
      phone: '+0987654321',
      company: 'Global Tech Solutions',
      address: '456 Innovation Avenue',
      city: 'San Francisco',
      country: 'USA',
    },
  ];

  for (const customerData of customers) {
    const customer = await prisma.customer.upsert({
      where: { email: customerData.email },
      update: {},
      create: customerData,
    });
    console.log(`✅ Created/Updated customer: ${customer.name}`);
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