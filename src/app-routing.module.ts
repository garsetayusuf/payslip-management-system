import { Module } from '@nestjs/common';
import { RouterModule, Routes } from '@nestjs/core';
import { HealthCheckModule } from './common/modules/health-check/health-check.module';
import { AuthModule } from './common/modules/auth/auth.module';
import { AuditModule } from './common/modules/audit/audit.module';
import { EmployeeModule } from './common/modules/employee/employee.module';
import { AttendanceModule } from './common/modules/attendance/attendance.module';
import { OvertimeModule } from './common/modules/overtime/overtime.module';
import { ReimbursementModule } from './common/modules/reimbursement/reimbursement.module';
import { PayrollModule } from './common/modules/payroll/payroll.module';
import { PayslipModule } from './common/modules/payslip/payslip.module';
import { AttendancePeriodModule } from './common/modules/attendance-period/attendance-period.module';

const routes: Routes = [
  { path: '/health-check', module: HealthCheckModule },
  { path: '/auth', module: AuthModule },
  { path: '/employee', module: EmployeeModule },
  { path: '/attendance-period', module: AttendancePeriodModule },
  { path: '/attendance', module: AttendanceModule },
  { path: '/overtime', module: OvertimeModule },
  { path: '/reimbursement', module: ReimbursementModule },
  { path: '/payroll', module: PayrollModule },
  { path: '/payslip', module: PayslipModule },
];

@Module({
  imports: [
    RouterModule.register(routes),
    HealthCheckModule,
    AuthModule,
    AuditModule,
    EmployeeModule,
    AttendancePeriodModule,
    AttendanceModule,
    OvertimeModule,
    ReimbursementModule,
    PayrollModule,
    PayslipModule,
  ],
})
export class AppRoutingModule {}
