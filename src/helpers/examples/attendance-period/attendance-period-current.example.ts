import { PeriodStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export function attendancePeriodCurrentExample(
  overrides: Partial<any> = {},
): any {
  return {
    id: uuidv4(),
    name: '1 week period',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: PeriodStatus.ACTIVE,
    isActive: true,
    payrollProcessed: false,
    processedAt: null,
    processedById: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: uuidv4(),
    updatedById: uuidv4(),
    createdBy: {
      id: uuidv4(),
      username: 'admin',
    },
    ...overrides,
  };
}
