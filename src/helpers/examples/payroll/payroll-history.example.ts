import { v4 as uuidv4 } from 'uuid';

export function payrollHistoryExample(overrides: Partial<any> = {}): any {
  return {
    data: [
      {
        id: uuidv4(),
        employeeId: uuidv4(),
        attendancePeriodId: uuidv4(),
        payslipNumber: 'PAY2025060003',
        baseSalary: '5749.58',
        workingDays: 6,
        attendedDays: 1,
        proratedSalary: '958.26',
        totalOvertimeHours: '3',
        overtimeRate: '179.67',
        totalOvertimePay: '539.02',
        totalReimbursements: '0',
        grossPay: '1497.29',
        deductions: '0',
        netPay: '1497.29',
        generatedAt: new Date(),
        ipAddress: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: uuidv4(),
        updatedById: null,
        employee: {
          id: uuidv4(),
          fullName: 'Howard Hoeger',
          employeeNumber: '792626',
          position: 'Investor Mobility Facilitator',
          department: 'Garden',
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
