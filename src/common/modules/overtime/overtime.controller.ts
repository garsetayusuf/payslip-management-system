import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OvertimeService } from './overtime.service';
import { CreateOvertimeDto } from './dto/create-overtime.dto';
import { UpdateOvertimeDto } from './dto/update-overtime.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { IpAddress } from 'src/common/decorators/ip-address.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { OvertimeResponseDto } from './dto/overtime-response.dto';
import { OvertimeQueryDto } from './dto/overtime-query.dto';
import { camelCaseToWords } from 'src/helpers/transform-camel-case';
import { DynamicApiExceptions } from 'src/common/decorators/swagger-dynamic-response.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { UpdateOvertimeStatusDto } from './dto/update-overtime-status.dto';
import { overtimeExample } from 'src/helpers/examples/overtime/overtime.example';

@ApiTags(camelCaseToWords(OvertimeController.name))
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE)
  @DynamicApiExceptions(OvertimeService, 'create')
  @ResponseMessage(
    'Overtime request submitted successfully',
    201,
    overtimeExample(),
  )
  async create(
    @Body() createOvertimeDto: CreateOvertimeDto,
    @CurrentUser() request: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
  ): Promise<OvertimeResponseDto> {
    return this.overtimeService.create(
      request.user.employeeId,
      createOvertimeDto,
      ipAddress,
      request.user.id,
    );
  }

  @Get()
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @DynamicApiExceptions(OvertimeService, 'findAllByEmployee')
  @ResponseMessage('Overtime records retrieved successfully', 200, [
    overtimeExample(),
  ])
  async findAll(@Query() query: OvertimeQueryDto) {
    return this.overtimeService.findAllByEmployee(query);
  }

  @Get(':id')
  @Roles(UserRole.EMPLOYEE)
  @DynamicApiExceptions(OvertimeService, 'findOne')
  @ResponseMessage(
    'Overtime record retrieved successfully',
    200,
    overtimeExample(),
  )
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() request: AuthenticatedRequest,
  ): Promise<OvertimeResponseDto> {
    return this.overtimeService.findOne(id, request.user.employeeId);
  }

  @Patch(':id')
  @Roles(UserRole.EMPLOYEE)
  @DynamicApiExceptions(OvertimeService, 'update')
  @ResponseMessage(
    'Overtime request updated successfully',
    200,
    overtimeExample(),
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOvertimeDto: UpdateOvertimeDto,
    @CurrentUser() request: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
  ): Promise<OvertimeResponseDto> {
    return this.overtimeService.update(
      id,
      request.user.employeeId,
      updateOvertimeDto,
      ipAddress,
      request.user.id,
    );
  }

  @Delete(':id')
  @Roles(UserRole.EMPLOYEE)
  @DynamicApiExceptions(OvertimeService, 'remove')
  @ResponseMessage('Overtime request deleted successfully', 200)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.overtimeService.remove(id, request.user.employeeId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(OvertimeService, 'updateStatus')
  @ResponseMessage(
    'Overtime request status updated successfully',
    200,
    overtimeExample(),
  )
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOvertimeStatusDto: UpdateOvertimeStatusDto,
    @CurrentUser() request: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
  ): Promise<OvertimeResponseDto> {
    return this.overtimeService.updateStatus(
      id,
      updateOvertimeStatusDto,
      request.user.id,
      ipAddress,
    );
  }
}
