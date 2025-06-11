import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOvertimeDto {
  @ApiProperty({
    description: 'Date of overtime work',
    example: '2024-06-10',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Start time of overtime in HH:mm format',
    example: '18:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End time of overtime in HH:mm format',
    example: '21:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: 'Number of hours worked (max 3 hours per day)',
    example: 3,
    minimum: 0.5,
    maximum: 3,
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5, { message: 'Minimum overtime is 0.5 hours' })
  @Max(3, { message: 'Maximum overtime is 3 hours per day' })
  hoursWorked: number;

  @ApiProperty({
    description: 'Reason for overtime',
    example: 'Project deadline completion',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Additional description (optional)',
    example: 'Working on critical bug fixes for production release',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
