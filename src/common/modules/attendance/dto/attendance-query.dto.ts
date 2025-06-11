import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/helpers/pagination-query.dto';

export class AttendanceQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Filter by attendance period ID',
    example: uuidv4(),
  })
  @IsOptional()
  @IsString()
  attendancePeriodId?: string;

  @ApiProperty({
    description: 'Filter by start date',
    example: new Date(),
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Filter by end date',
    example: new Date(new Date().setDate(new Date().getDate() + 7)),
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Filter by status',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}
