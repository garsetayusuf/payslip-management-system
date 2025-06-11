import { v4 as uuidv4 } from 'uuid';

export function payslipSummaryExample(overrides: Partial<any> = {}): any {
  return {
    totalNetPay: 1497.2864583333333,
    payslips: [
      {
        employeeId: uuidv4(),
        employeeName: 'Howard Hoeger',
        netPay: 1497.2864583333333,
        periodId: uuidv4(),
      },
      {
        employeeId: uuidv4(),
        employeeName: 'Denise Ankunding',
        netPay: 0,
        periodId: uuidv4(),
      },
    ],
    ...overrides,
  };
}
