import { v4 as uuidv4 } from 'uuid';

export function payrollSummaryExample(overrides: Partial<any> = {}): any {
  return {
    periodId: uuidv4(),
    periodName: null,
    totalEmployees: 0,
    processedEmployees: 0,
    totalGrossPay: 0,
    totalNetPay: 0,
    totalDeductions: 0,
    totalOvertimePay: 0,
    totalReimbursements: 0,
    processedAt: null,
    processedBy: null,
    ...overrides,
  };
}
