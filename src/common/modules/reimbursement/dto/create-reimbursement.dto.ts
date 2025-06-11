import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateReimbursementDto {
  @ApiProperty({
    description: 'Attendance period ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  attendancePeriodId: string;

  @ApiProperty({
    description: 'Reimbursement amount',
    example: 250000,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsPositive({ message: 'Amount must be greater than zero' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiProperty({
    description: 'Description of the reimbursement',
    example: 'Transportation expense for client meeting',
    minLength: 10,
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description: string;

  @ApiPropertyOptional({
    description: 'Updated URL to receipt or supporting document',
    example: 'https://example.com/updated-receipt.pdf',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Receipt URL must be a valid URL' })
  @MaxLength(500, { message: 'Receipt URL cannot exceed 500 characters' })
  receiptUrl?: string;
}
