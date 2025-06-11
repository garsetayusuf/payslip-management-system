import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/helpers/pagination-query.dto';

export class EmployeeQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Search employees',
    example: 'howard',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
