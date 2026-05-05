import {
  Controller, Post, Get, Patch, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { CheckInDto, UpdateAttendanceStatusDto, TeacherMarkDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('เช็คชื่อ')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles(Role.STUDENT)
  @UseInterceptors(
    FileInterceptor('selfie', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'เช็คชื่อเข้าเรียน (นักศึกษา)',
    description: 'ตรวจสอบ 4 ปัจจัย: สิทธิ์เรียน + ช่วงเวลา + GPS + Device แล้วบันทึก Selfie',
  })
  @ApiConsumes('multipart/form-data')
  checkIn(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckInDto,
    @UploadedFile() selfie?: Express.Multer.File,
  ) {
    return this.attendanceService.checkIn(user, dto, selfie);
  }

  @Post('mark')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'อาจารย์บันทึก/แก้ไขสถานะการเข้าเรียนด้วยตนเอง' })
  teacherMark(@Body() dto: TeacherMarkDto, @CurrentUser() user: JwtPayload) {
    return this.attendanceService.teacherMark(dto, user);
  }

  @Get('schedule/:scheduleId/stats')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'สรุปสถิติเช็คชื่อรายคาบ (onTime/late/absent/leave/notChecked)' })
  @ApiQuery({ name: 'classDate', required: false, description: 'วันที่ (YYYY-MM-DD) default = วันนี้' })
  getScheduleStats(
    @Param('scheduleId') scheduleId: string,
    @Query('classDate') classDate?: string,
  ) {
    return this.attendanceService.getScheduleStats(scheduleId, classDate);
  }

  @Get('schedule/:scheduleId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'ดูรายชื่อเช็คชื่อรายคาบ (อาจารย์/Admin)' })
  @ApiQuery({ name: 'classDate', required: false, description: 'วันที่ (YYYY-MM-DD)' })
  getBySchedule(
    @Param('scheduleId') scheduleId: string,
    @Query('classDate') classDate?: string,
  ) {
    return this.attendanceService.getAttendanceBySchedule(scheduleId, classDate);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'ดูประวัติการเข้าเรียนของนักศึกษา' })
  @ApiQuery({ name: 'scheduleId', required: false })
  getStudentHistory(
    @Param('studentId') studentId: string,
    @Query('scheduleId') scheduleId?: string,
  ) {
    return this.attendanceService.getStudentAttendanceHistory(studentId, scheduleId);
  }

  @Get('flags')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'ดูรายการเช็คชื่อที่ถูก Flag ว่าผิดปกติ' })
  @ApiQuery({ name: 'scheduleId', required: false })
  getFlagged(@Query('scheduleId') scheduleId?: string) {
    return this.attendanceService.getFlaggedRecords(scheduleId);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'แก้ไขสถานะการเช็คชื่อ (อาจารย์/Admin)',
    description: 'ทุกการแก้ไขถูกบันทึกใน Audit Log อัตโนมัติ',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attendanceService.updateAttendanceStatus(id, dto, user);
  }
}
