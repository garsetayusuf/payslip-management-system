import { IsUUID, IsArray, IsOptional, ArrayMinSize } from 'class-validator';

export class ProcessPayrollDto {
  @IsUUID()
  periodId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  employeeIds?: string[];
}
