import { ApiProperty } from '@nestjs/swagger';
import { OvertimeStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateOvertimeStatusDto {
  @ApiProperty({
    description: 'Filter by status',
    enum: OvertimeStatus,
    example: OvertimeStatus.APPROVED,
  })
  @IsEnum(OvertimeStatus)
  status: OvertimeStatus;
}
