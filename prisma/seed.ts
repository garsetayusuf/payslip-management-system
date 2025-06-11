import * as dotenv from 'dotenv';
import ansis from 'ansis';
import { generateSeedUsersAndEmployees } from './seeds/users-and-employees';
import { PrismaClient } from '@prisma/client';
import { seedData } from './seeds/utils/seed-helper';

const prisma = new PrismaClient();

async function main() {
  dotenv.config();
  console.log('\n' + ansis.blue.bold('🌱 Starting database seeding...\n'));

  const { users, employees } = await generateSeedUsersAndEmployees();

  await seedData(prisma, 'user', users, 'email', 'Users');
  await seedData(prisma, 'employee', employees, 'employeeCode', 'Employees');

  console.log(ansis.blue.bold('🎉 Database seeding completed!\n'));
}

main()
  .catch((e) => console.error(e))
  .finally(() => {
    prisma.$disconnect();
  });
