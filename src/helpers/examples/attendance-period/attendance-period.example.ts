import { v4 as uuidv4 } from 'uuid';

export function attendancePeriodExample(overrides: Partial<any> = {}): any {
  return {
    id: uuidv4(),
    name: 'Period 1',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: uuidv4(),
    updatedById: null,
    ...overrides,
  };
}
