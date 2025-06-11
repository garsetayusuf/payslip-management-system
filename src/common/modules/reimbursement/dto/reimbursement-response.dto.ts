import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReimbursementStatus } from '@prisma/client';

export class ReimbursementResponseDto {
  @ApiProperty({
    description: 'Reimbursement ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Employee ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  employeeId: string;

  @ApiProperty({
    description: 'Attendance period ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  attendancePeriodId: string;

  @ApiProperty({
    description: 'Reimbursement amount',
    example: 250000,
  })
  amount: number;

  @ApiProperty({
    description: 'Description of the reimbursement',
    example: 'Transportation expense for client meeting',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'URL to receipt or supporting document',
    example: 'https://example.com/receipt.pdf',
  })
  receiptUrl?: string;

  @ApiProperty({
    description: 'Reimbursement status',
    enum: ReimbursementStatus,
    example: ReimbursementStatus.PENDING,
  })
  status: ReimbursementStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Employee information',
  })
  employee?: {
    employeeCode: string;
    fullName: string;
    email: string;
  };

  @ApiPropertyOptional({
    description: 'Attendance period information',
  })
  attendancePeriod?: {
    periodName: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
}

export class ReimbursementListResponseDto {
  @ApiProperty({
    description: 'List of reimbursements',
    type: [ReimbursementResponseDto],
  })
  data: ReimbursementResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ReimbursementSummaryDto {
  @ApiProperty({
    description: 'Summary by status',
  })
  summary: Array<{
    status: ReimbursementStatus;
    count: number;
    totalAmount: number;
  }>;

  @ApiProperty({
    description: 'Overall summary',
  })
  overall: {
    totalCount: number;
    totalAmount: number;
  };
}
