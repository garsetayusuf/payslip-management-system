import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { UserRole } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { ApiTags } from '@nestjs/swagger';
import { camelCaseToWords } from 'src/helpers/transform-camel-case';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { DynamicApiExceptions } from 'src/common/decorators/swagger-dynamic-response.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { employeeAllExample } from 'src/helpers/examples/employee/employee-all.example';
import { employeeExample } from 'src/helpers/examples/employee/emploee.example';

@ApiTags(camelCaseToWords(EmployeeController.name))
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(EmployeeService, 'create')
  @ResponseMessage('Employee created successfully', 201, employeeExample())
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() request: AuthenticatedRequest,
  ) {
    return this.employeeService.create(createEmployeeDto, request.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(EmployeeService, 'findAll')
  @ResponseMessage(
    'Employees retrieved successfully',
    200,
    employeeAllExample(),
  )
  findAll(@Query() query: EmployeeQueryDto) {
    return this.employeeService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(EmployeeService, 'findOne')
  @ResponseMessage('Employee retrieved successfully', 200, employeeExample())
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(EmployeeService, 'update')
  @ResponseMessage('Employee updated successfully', 200, employeeExample())
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() request: AuthenticatedRequest,
  ) {
    return this.employeeService.update(id, updateEmployeeDto, request.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(EmployeeService, 'remove')
  @ResponseMessage('Employee deleted successfully', 200)
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}
