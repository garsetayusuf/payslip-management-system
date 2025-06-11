import { Module } from '@nestjs/common';
import { PayslipService } from './payslip.service';
import { PayslipController } from './payslip.controller';
import { PayrollService } from '../payroll/payroll.service';

@Module({
  controllers: [PayslipController],
  providers: [PayslipService, PayrollService],
})
export class PayslipModule {}
