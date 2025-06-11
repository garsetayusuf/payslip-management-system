import { ApiProperty } from '@nestjs/swagger';
import { ReimbursementStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateReimbursementStatusDto {
  @ApiProperty({
    description: 'New status for the reimbursement',
    enum: ReimbursementStatus,
    example: ReimbursementStatus.APPROVED,
  })
  @IsNotEmpty()
  @IsEnum(ReimbursementStatus, {
    message: 'Status must be one of: PENDING, APPROVED, REJECTED',
  })
  status: ReimbursementStatus;
}
