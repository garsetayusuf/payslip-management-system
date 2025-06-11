import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, PrismaClient } from '@prisma/client';

@Injectable()
export class AuditService {
  private logger = new Logger(AuditService.name);
  constructor(private prisma: PrismaClient) {}

  async logAudit(
    tableName: string,
    recordId: string,
    action: AuditAction,
    oldValues?: object,
    newValues?: object,
    userId?: string,
    ipAddress?: string,
    requestId?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          tableName,
          recordId,
          action,
          oldValues: oldValues || null,
          newValues: newValues || null,
          userId: userId || null,
          ipAddress: ipAddress || null,
          requestId: requestId || null,
        },
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
