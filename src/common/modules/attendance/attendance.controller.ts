import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import { ApiTags } from '@nestjs/swagger';
import { camelCaseToWords } from 'src/helpers/transform-camel-case';
import { DynamicApiExceptions } from 'src/common/decorators/swagger-dynamic-response.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { IpAddress } from 'src/common/decorators/ip-address.decorator';
import { attendanceExample } from 'src/helpers/examples/attendance/attendance.example';
import { attendanceSummaryExample } from 'src/helpers/examples/attendance/attendance-summary.example';

@ApiTags(camelCaseToWords(AttendanceController.name))
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYEE)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @DynamicApiExceptions(AttendanceService, 'submitAttendance')
  @ResponseMessage(
    'Attendance submitted successfully',
    201,
    attendanceExample(),
  )
  async submitAttendance(
    @Body() submitAttendanceDto: SubmitAttendanceDto,
    @CurrentUser() request: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
  ) {
    return await this.attendanceService.submitAttendance(
      request.user.employeeId,
      submitAttendanceDto,
      request.user.id,
      ipAddress,
    );
  }

  @Get()
  @DynamicApiExceptions(AttendanceService, 'findAll')
  @ResponseMessage('Attendance records retrieved successfully', 200, [
    attendanceExample(),
  ])
  async findAll(
    @Query() query: AttendanceQueryDto,
    @CurrentUser() request: AuthenticatedRequest,
  ) {
    return await this.attendanceService.findAll(query, request.user.employeeId);
  }

  @Get('summary')
  @DynamicApiExceptions(AttendanceService, 'getAttendanceSummary')
  @ResponseMessage(
    'Attendance summary retrieved successfully',
    200,
    attendanceSummaryExample(),
  )
  async getAttendanceSummary(
    @Query('periodId') periodId: string,
    @CurrentUser() request: AuthenticatedRequest,
  ) {
    return await this.attendanceService.getAttendanceSummary(
      request.user.employeeId,
      periodId,
    );
  }

  @Get('period/:periodId')
  @DynamicApiExceptions(AttendanceService, 'findByPeriod')
  @ResponseMessage(
    'Attendance records for period retrieved successfully',
    200,
    [attendanceExample()],
  )
  async findByPeriod(
    @Param('periodId') periodId: string,
    @CurrentUser() request: AuthenticatedRequest,
  ) {
    return await this.attendanceService.findByPeriod(
      periodId,
      request.user.employeeId,
    );
  }
}
