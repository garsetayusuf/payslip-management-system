import { v4 as uuidv4 } from 'uuid';

export function employeeAllExample(overrides: Partial<any> = {}): any {
  return {
    data: [
      {
        id: uuidv4(),
        userId: uuidv4(),
        employeeCode: 'EMP0100',
        fullName: 'Dr. John Ortiz',
        employeeNumber: '524414',
        department: 'Garden',
        position: 'Legacy Integration Developer',
        email: 'dr._kautzer@gmail.com',
        monthlySalary: '4339.29',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: uuidv4(),
        updatedById: null,
        user: {
          id: 'uuidv4()',
          username: 'dr..altenwerth51',
          email: 'dr._kautzer@gmail.com',
          role: 'EMPLOYEE',
        },
      },
      {
        id: uuidv4(),
        userId: uuidv4(),
        employeeCode: 'EMP0101',
        fullName: 'Dr. John Ortiz',
        employeeNumber: '524414',
        department: 'Garden',
        position: 'Legacy Integration Developer',
        email: 'dr._kautzer@gmail.com',
        monthlySalary: '4339.29',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: uuidv4(),
        updatedById: null,
        user: {
          id: 'uuidv4()',
          username: 'dr..altenwerth51',
          email: 'dr._kautzer@gmail.com',
          role: 'EMPLOYEE',
        },
      },
    ],
    pagination: {
      total: 0,
      page: 0,
      limit: 0,
      totalPages: 0,
    },
    ...overrides,
  };
}
