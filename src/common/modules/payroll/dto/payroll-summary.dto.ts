export class PayrollSummaryDto {
  periodId: string;
  periodName: string;
  totalEmployees: number;
  processedEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalOvertimePay: number;
  totalReimbursements: number;
  processedAt?: Date;
  processedBy?: string;
}
