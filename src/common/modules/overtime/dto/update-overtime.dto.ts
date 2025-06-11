import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateOvertimeDto } from './create-overtime.dto';

export class UpdateOvertimeDto extends PartialType(
  OmitType(CreateOvertimeDto, ['date'] as const),
) {}
