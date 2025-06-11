import { v4 as uuidv4 } from 'uuid';

export function payslipGenerateExample(overrides: Partial<any> = {}): any {
  return {
    periodId: uuidv4(),
    employeeId: uuidv4(),
    employeeName: 'Howard Hoeger',
    baseSalary: 0,
    workingDays: 0,
    attendedDays: 0,
    proratedSalary: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    overtimePay: 0,
    reimbursements: 0,
    grossPay: 0,
    deductions: 0,
    netPay: 0,
    ...overrides,
  };
}
