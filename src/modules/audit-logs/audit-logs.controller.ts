import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('ประวัติการแก้ไข')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEACHER)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'ดู Audit Log ทั้งหมด' })
  @ApiQuery({ name: 'attendanceRecordId', required: false })
  @ApiQuery({ name: 'modifiedById', required: false })
  findAll(
    @Query('attendanceRecordId') attendanceRecordId?: string,
    @Query('modifiedById') modifiedById?: string,
  ) {
    return this.auditLogsService.findAll({ attendanceRecordId, modifiedById });
  }

  @Get('attendance/:attendanceRecordId')
  @ApiOperation({ summary: 'ดู Audit Log ของรายการเช็คชื่อ' })
  findByRecord(@Param('attendanceRecordId') id: string) {
    return this.auditLogsService.findByAttendanceRecord(id);
  }
}
