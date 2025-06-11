export class PayslipDto {
  periodId: string;
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  workingDays: number;
  attendedDays: number;
  proratedSalary: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  reimbursements: number;
  grossPay: number;
  deductions: number;
  netPay: number;
}

export class PayslipSummaryDto {
  periodId: string;
  employeeId: string;
  employeeName: string;
  netPay: number;
}

export class PayslipSummaryResponseDto {
  totalNetPay: number;
  payslips: PayslipSummaryDto[];
}
