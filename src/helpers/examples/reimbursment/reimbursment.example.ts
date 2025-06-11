import { v4 as uuidv4 } from 'uuid';

export function reimbursmentExample(overrides: Partial<any> = {}): any {
  return {
    id: uuidv4(),
    employeeId: uuidv4(),
    attendancePeriodId: uuidv4(),
    amount: '250000',
    description: 'Transportation expense for client meeting',
    receiptUrl: 'https://example.com/updated-receipt.pdf',
    status: 'PENDING',
    ipAddress: '127.0.0.1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: uuidv4(),
    updatedById: null,
    employee: {
      employeeCode: 'EMP0001',
      fullName: 'Howard Hoeger',
      email: 'howard_mueller@yahoo.com',
    },
    attendancePeriod: {
      name: '1 week period',
      startDate: '2025-06-10T00:00:00.000Z',
      endDate: '2025-06-17T00:00:00.000Z',
      status: 'ACTIVE',
    },
    ...overrides,
  };
}
