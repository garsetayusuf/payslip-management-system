import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReimbursementStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/helpers/pagination-query.dto';

export class ReimbursmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by attendance period ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  attendancePeriodId?: string;

  @ApiPropertyOptional({
    description: 'Filter by reimbursement status',
    enum: ReimbursementStatus,
    example: ReimbursementStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(ReimbursementStatus)
  status?: ReimbursementStatus;
}
