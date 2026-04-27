import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('รายงาน')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEACHER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('schedule/:scheduleId/students')
  @ApiOperation({ summary: 'สรุปการเข้าเรียนรายนักศึกษาในวิชานั้น (พร้อม % เข้าเรียน)' })
  getScheduleStudentSummary(@Param('scheduleId') scheduleId: string) {
    return this.reportsService.getScheduleStudentSummary(scheduleId);
  }

  @Get('schedule/:scheduleId')
  @ApiOperation({ summary: 'สรุปสถิติเช็คชื่อรายวิชา' })
  getScheduleSummary(@Param('scheduleId') scheduleId: string) {
    return this.reportsService.getAttendanceSummaryBySchedule(scheduleId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'สรุปการเข้าเรียนรายนักศึกษา' })
  @ApiQuery({ name: 'semesterId', required: false })
  getStudentSummary(
    @Param('studentId') studentId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.reportsService.getStudentAttendanceSummary(studentId, semesterId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export ข้อมูลเช็คชื่อ (JSON — ใช้ต่อกับ xlsx ฝั่ง Frontend)' })
  @ApiQuery({ name: 'semesterId', required: false })
  @ApiQuery({ name: 'facultyId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'scheduleId', required: false })
  export(
    @Query('semesterId') semesterId?: string,
    @Query('facultyId') facultyId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('scheduleId') scheduleId?: string,
  ) {
    return this.reportsService.getExportData({ semesterId, facultyId, departmentId, scheduleId });
  }
}
