import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email',
    example: 'johndoe@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  username: string;

  @ApiProperty({
    description: 'Name',
    example: 'johndoe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Password',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
