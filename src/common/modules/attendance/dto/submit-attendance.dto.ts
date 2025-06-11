import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubmitAttendanceDto {
  @ApiProperty({
    description: 'Attendance notes',
    example: 'Attended',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
