export class PayrollCalculationDto {
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
