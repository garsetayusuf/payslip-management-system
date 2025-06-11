import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ProcessPayrollDto } from './dto/process-payroll.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { ApiTags } from '@nestjs/swagger';
import { camelCaseToWords } from 'src/helpers/transform-camel-case';
import { DynamicApiExceptions } from 'src/common/decorators/swagger-dynamic-response.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { payrollProcessExample } from 'src/helpers/examples/payroll/payroll-process.example';
import { payrollSummaryExample } from 'src/helpers/examples/payroll/payroll-summary.example';
import { payrollStatusExample } from 'src/helpers/examples/payroll/payroll-status.example';
import { payrollHistoryExample } from 'src/helpers/examples/payroll/payroll-history.example';

@ApiTags(camelCaseToWords(PayrollController.name))
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('process')
  @DynamicApiExceptions(PayrollService, 'processPayroll')
  @ResponseMessage(
    'Payroll processed successfully',
    201,
    payrollProcessExample(),
  )
  async processPayroll(
    @Body() processPayrollDto: ProcessPayrollDto,
    @CurrentUser() request: AuthenticatedRequest,
  ) {
    return this.payrollService.processPayroll(
      processPayrollDto,
      request.user.id,
    );
  }

  @Get('summary/:periodId')
  @DynamicApiExceptions(PayrollService, 'getPayrollSummary')
  @ResponseMessage(
    'Payroll summary retrieved successfully',
    200,
    payrollSummaryExample(),
  )
  async getPayrollSummary(@Param('periodId') periodId: string) {
    return this.payrollService.getPayrollSummary(periodId);
  }

  @Get('status/:periodId')
  @DynamicApiExceptions(PayrollService, 'getPayrollStatus')
  @ResponseMessage(
    'Payroll status retrieved successfully',
    200,
    payrollStatusExample(),
  )
  async getPayrollStatus(@Param('periodId') periodId: string) {
    return this.payrollService.getPayrollStatus(periodId);
  }

  @Get('history')
  @DynamicApiExceptions(PayrollService, 'getPayrollHistory')
  @ResponseMessage(
    'Payroll history retrieved successfully',
    200,
    payrollHistoryExample(),
  )
  async getPayrollHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.payrollService.getPayrollHistory(page, limit);
  }
}
