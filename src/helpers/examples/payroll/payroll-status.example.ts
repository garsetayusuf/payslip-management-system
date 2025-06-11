import { v4 as uuidv4 } from 'uuid';
export function payrollStatusExample(overrides: Partial<any> = {}): any {
  return {
    periodId: uuidv4(),
    periodName: null,
    totalEmployees: 0,
    processedEmployees: 0,
    isProcessed: false,
    processedAt: null,
    canProcess: false,
    ...overrides,
  };
}
