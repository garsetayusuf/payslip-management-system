import { EmployeeStatus, UserRole } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { loadConfig } from '../../src/common/config/env.config';

export async function generateSeedUsersAndEmployees() {
  const employees: any[] = [];
  const users: any[] = [];

  const passwordHash = await bcrypt.hash(
    'Password123',
    loadConfig().auth.passwordSaltRounds,
  );
  const adminPasswordHash = await bcrypt.hash(
    'Admin@123',
    loadConfig().auth.passwordSaltRounds,
  );

  // Admin User
  users.push({
    name: 'Admin',
    email: 'admin@example.com',
    username: 'admin',
    password: adminPasswordHash,
    role: UserRole.ADMIN,
    createdAt: new Date(),
  });

  // 100 Employees
  for (let i = 0; i < 100; i++) {
    const fullName = faker.person.fullName();
    const username = faker.internet
      .username({ firstName: fullName.split(' ')[0] })
      .toLowerCase();
    const email = faker.internet
      .email({ firstName: fullName.split(' ')[0] })
      .toLowerCase();
    const employeeCode = `EMP${String(i + 1).padStart(4, '0')}`;
    const userId = faker.string.uuid();

    users.push({
      id: userId,
      name: fullName,
      email,
      username,
      password: passwordHash,
      role: UserRole.EMPLOYEE,
      createdAt: new Date(),
    });

    employees.push({
      userId: userId,
      employeeCode,
      fullName,
      employeeNumber: faker.string.numeric(6),
      department: faker.commerce.department(),
      position: faker.person.jobTitle(),
      email,
      monthlySalary: parseFloat(
        faker.finance.amount({ min: 3000, max: 8000, dec: 2 }),
      ),
      status: EmployeeStatus.ACTIVE,
      createdAt: new Date(),
    });
  }

  return { users, employees };
}
