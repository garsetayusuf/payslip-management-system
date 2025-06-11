import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'user ID',
    example: '5f6d6a8b2e5c4f5e9d1d9a5f7c3b2a1',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'New password',
    example: 'Password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
