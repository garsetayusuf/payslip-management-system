import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttendancePeriodDto {
  @ApiProperty({
    description: 'Name of the period',
    example: 'Period 1',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Start date of the period',
    example: new Date(),
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date of the period',
    example: new Date(new Date().setDate(new Date().getDate() + 7)),
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Is the period active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}
