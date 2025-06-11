import { IsOptional, IsEnum } from 'class-validator';
import { PeriodStatus } from '@prisma/client';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAttendancePeriodDto } from './create-attendance-period.dto';

export class UpdateAttendancePeriodDto extends PartialType(
  CreateAttendancePeriodDto,
) {
  @ApiProperty({
    description: 'Status of the period',
    enum: PeriodStatus,
    example: PeriodStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PeriodStatus)
  status?: PeriodStatus;
}
