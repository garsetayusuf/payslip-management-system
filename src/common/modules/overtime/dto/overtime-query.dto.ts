import { IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/helpers/pagination-query.dto';
import { OvertimeStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class OvertimeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Employee ID',
    example: uuidv4(),
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: OvertimeStatus,
  })
  @IsOptional()
  @IsEnum(OvertimeStatus)
  status?: OvertimeStatus;

  @ApiPropertyOptional({
    description: 'Filter from date',
    example: new Date(),
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter to date',
    example: new Date(),
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
