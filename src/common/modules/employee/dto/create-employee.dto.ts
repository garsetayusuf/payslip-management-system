import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EmployeeStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Full name of the employee',
    example: 'Howard Hoeger',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'Employee number',
    example: '792626',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  employeeNumber: string;

  @ApiProperty({
    description: 'Department of the employee',
    example: 'Garden',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  department: string;

  @ApiProperty({
    description: 'Position of the employee',
    example: 'Investor Mobility Facilitator',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  position: string;

  @ApiProperty({
    description: 'Email of the employee',
    example: 'howard_mueller@yahoo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Monthly salary of the employee',
    example: 5749.58,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  monthlySalary: number;

  @ApiProperty({
    description: 'Status of the employee',
    enum: EmployeeStatus,
    example: EmployeeStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiProperty({
    description: 'Username of the employee',
    example: 'howard',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Password of the employee',
    example: 'Password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
