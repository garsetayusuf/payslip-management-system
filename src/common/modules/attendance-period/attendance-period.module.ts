import { Module } from '@nestjs/common';
import { AttendancePeriodService } from './attendance-period.service';
import { AttendancePeriodController } from './attendance-period.controller';

@Module({
  controllers: [AttendancePeriodController],
  providers: [AttendancePeriodService],
})
export class AttendancePeriodModule {}
