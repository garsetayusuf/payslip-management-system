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
} from '@nestjs/common';
import { AttendancePeriodService } from './attendance-period.service';
import { CreateAttendancePeriodDto } from './dto/create-attendance-period.dto';
import { UpdateAttendancePeriodDto } from './dto/update-attendance-period.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { camelCaseToWords } from 'src/helpers/transform-camel-case';
import { DynamicApiExceptions } from 'src/common/decorators/swagger-dynamic-response.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { PaginationQueryDto } from 'src/helpers/pagination-query.dto';
import { attendancePeriodExample } from 'src/helpers/examples/attendance-period/attendance-period.example';
import { attendancePeriodCurrentExample } from 'src/helpers/examples/attendance-period/attendance-period-current.example';

@ApiTags(camelCaseToWords(AttendancePeriodController.name))
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendancePeriodController {
  constructor(
    private readonly attendancePeriodService: AttendancePeriodService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(AttendancePeriodService, 'create')
  @ResponseMessage(
    'Period created successfully',
    201,
    attendancePeriodExample(),
  )
  create(
    @Body() createPeriodDto: CreateAttendancePeriodDto,
    @CurrentUser() request: AuthenticatedRequest,
  ) {
    return this.attendancePeriodService.create(
      createPeriodDto,
      request.user.id,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(AttendancePeriodService, 'findAll')
  @ResponseMessage('Periods retrieved successfully', 200, [
    attendancePeriodExample(),
  ])
  findAll(@Query() query: PaginationQueryDto) {
    return this.attendancePeriodService.findAll(query.page, query.limit);
  }

  @Get('current')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @DynamicApiExceptions(AttendancePeriodService, 'findCurrent')
  @ResponseMessage(
    'Current period retrieved successfully',
    200,
    attendancePeriodCurrentExample(),
  )
  findCurrent() {
    return this.attendancePeriodService.findCurrent();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(AttendancePeriodService, 'findOne')
  @ResponseMessage(
    'Period retrieved successfully',
    200,
    attendancePeriodExample(),
  )
  findOne(@Param('id') id: string) {
    return this.attendancePeriodService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(AttendancePeriodService, 'update')
  @ResponseMessage(
    'Period updated successfully',
    200,
    attendancePeriodExample(),
  )
  update(
    @Param('id') id: string,
    @Body() updatePeriodDto: UpdateAttendancePeriodDto,
    @CurrentUser() request: AuthenticatedRequest,
  ) {
    return this.attendancePeriodService.update(
      id,
      updatePeriodDto,
      request.user.id,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(AttendancePeriodService, 'remove')
  @ResponseMessage('Period deleted successfully', 200)
  remove(@Param('id') id: string) {
    return this.attendancePeriodService.remove(id);
  }
}
