import { ApiProperty } from '@nestjs/swagger';

export class OvertimeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  attendancePeriodId: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty()
  hoursWorked: number;

  @ApiProperty()
  reason: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  status: string;

  @ApiProperty()
  hasAttendance: boolean;

  @ApiProperty({ required: false })
  submittedAt?: Date;

  @ApiProperty({ required: false })
  approvedAt?: Date;

  @ApiProperty({ required: false })
  approvedById?: string;

  @ApiProperty({ required: false })
  cancelledAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  employee?: {
    id: string;
    fullName: string;
    employeeCode: string;
    department: string;
    position: string;
  };

  @ApiProperty({ required: false })
  attendancePeriod?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  };
}
