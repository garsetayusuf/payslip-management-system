import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ValidationPipe,
  Query,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ReimbursementService } from './reimbursement.service';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { UpdateReimbursementDto } from './dto/update-reimbursement.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { IpAddress } from 'src/common/decorators/ip-address.decorator';
import { Reimbursement, UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { DynamicApiExceptions } from 'src/common/decorators/swagger-dynamic-response.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { camelCaseToWords } from 'src/helpers/transform-camel-case';
import { reimbursmentExample } from 'src/helpers/examples/reimbursment/reimbursment.example';
import { reimbursmentAllExample } from 'src/helpers/examples/reimbursment/reimbursment-all.example';
import { reimbursmentSummaryExample } from 'src/helpers/examples/reimbursment/reimbursment-summary.example';
import { ReimbursmentQueryDto } from './dto/reimbursment-query.dto';
import { UpdateReimbursementStatusDto } from './dto/update-reimbursment-status.dto';

@ApiTags(camelCaseToWords(ReimbursementController.name))
@Controller()
export class ReimbursementController {
  constructor(private readonly reimbursementService: ReimbursementService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @DynamicApiExceptions(ReimbursementService, 'createReimbursement')
  @ResponseMessage(
    'Reimbursement request submitted successfully',
    201,
    reimbursmentExample(),
  )
  async createReimbursement(
    @Body(ValidationPipe) createReimbursementDto: CreateReimbursementDto,
    @CurrentUser() request: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
  ) {
    return this.reimbursementService.createReimbursement(
      createReimbursementDto,
      request.user.employeeId,
      request.user.id,
      ipAddress,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @DynamicApiExceptions(ReimbursementService, 'getReimbursementsAll')
  @ResponseMessage(
    'Employee reimbursements retrieved successfully',
    200,
    reimbursmentAllExample(),
  )
  async getReimbursementsAll(
    @Query(ValidationPipe) query: ReimbursmentQueryDto,
    @CurrentUser() request: AuthenticatedRequest,
  ) {
    return this.reimbursementService.getReimbursementsAll(
      request.user.employeeId,
      query,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @DynamicApiExceptions(ReimbursementService, 'getReimbursementById')
  @ResponseMessage(
    'Reimbursement retrieved successfully',
    200,
    reimbursmentExample(),
  )
  async getReimbursementById(
    @Param('id', ParseUUIDPipe) reimbursementId: string,
    @CurrentUser() request: AuthenticatedRequest,
  ): Promise<Reimbursement> {
    return this.reimbursementService.getReimbursementById(
      reimbursementId,
      request.user.employeeId,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @DynamicApiExceptions(ReimbursementService, 'updateReimbursement')
  @ResponseMessage(
    'Reimbursement updated successfully',
    200,
    reimbursmentExample(),
  )
  async updateReimbursement(
    @Param('id', ParseUUIDPipe) reimbursementId: string,
    @Body(ValidationPipe) updateReimbursementDto: UpdateReimbursementDto,
    @CurrentUser() request: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
  ) {
    return this.reimbursementService.updateReimbursement(
      reimbursementId,
      updateReimbursementDto,
      request.user.employeeId,
      request.user.id,
      ipAddress,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @DynamicApiExceptions(ReimbursementService, 'deleteReimbursement')
  @ResponseMessage('Reimbursement deleted successfully', 200)
  async deleteReimbursement(
    @Param('id', ParseUUIDPipe) reimbursementId: string,
    @CurrentUser() request: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
  ) {
    return this.reimbursementService.deleteReimbursement(
      reimbursementId,
      request.user.employeeId,
      request.user.id,
      ipAddress,
    );
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @DynamicApiExceptions(ReimbursementService, 'updateReimbursementStatus')
  @ResponseMessage(
    'Reimbursement status updated successfully',
    200,
    reimbursmentExample(),
  )
  async updateReimbursementStatus(
    @Param('id', ParseUUIDPipe) reimbursementId: string,
    @Body(ValidationPipe)
    updateReimbursementStatusDto: UpdateReimbursementStatusDto,
    @CurrentUser() request: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
  ) {
    return this.reimbursementService.updateReimbursementStatus(
      reimbursementId,
      updateReimbursementStatusDto.status,
      request.user.id,
      ipAddress,
    );
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @DynamicApiExceptions(ReimbursementService, 'getReimbursementSummary')
  @ResponseMessage(
    'Reimbursement summary retrieved successfully',
    200,
    reimbursmentSummaryExample(),
  )
  @ApiQuery({ name: 'attendancePeriodId', required: false, type: String })
  async getReimbursementSummary(
    @Query('attendancePeriodId') attendancePeriodId?: string,
  ) {
    return this.reimbursementService.getReimbursementSummary(
      attendancePeriodId,
    );
  }
}
