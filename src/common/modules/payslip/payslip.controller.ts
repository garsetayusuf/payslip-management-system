import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PayslipService } from './payslip.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PayslipDto, PayslipSummaryResponseDto } from './dto/payslip.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { camelCaseToWords } from 'src/helpers/transform-camel-case';
import { DynamicApiExceptions } from 'src/common/decorators/swagger-dynamic-response.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { payslipGenerateExample } from 'src/helpers/examples/payslip/payslip-generate.example';
import { payslipSummaryExample } from 'src/helpers/examples/payslip/payslip-summary.example';
import { IpAddress } from 'src/common/decorators/ip-address.decorator';

@ApiTags(camelCaseToWords(PayslipController.name))
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PayslipController {
  constructor(private readonly payslipService: PayslipService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE)
  @DynamicApiExceptions(PayslipService, 'generatePayslip')
  @ResponseMessage(
    'Payslip generated successfully',
    201,
    payslipGenerateExample(),
  )
  async generatePayslip(
    @CurrentUser() request: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
  ): Promise<PayslipDto> {
    return this.payslipService.generatePayslip(
      request.user.employeeId,
      request.user.id,
      ipAddress,
    );
  }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(PayslipService, 'generatePayslipSummary')
  @ResponseMessage(
    'Payslip summary generated successfully',
    200,
    payslipSummaryExample(),
  )
  async generatePayslipSummary(
    @CurrentUser() request: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
  ): Promise<PayslipSummaryResponseDto> {
    return this.payslipService.generatePayslipSummary(
      request.user.id,
      ipAddress,
    );
  }
}
