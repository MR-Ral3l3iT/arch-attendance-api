import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AttendanceSettingsService } from './attendance-settings.service';
import { UpsertAttendanceSettingsDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('เงื่อนไขเช็คชื่อ')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance-settings')
export class AttendanceSettingsController {
  constructor(private readonly settingsService: AttendanceSettingsService) {}

  @Get(':scheduleId')
  @ApiOperation({
    summary:
      'ดูเงื่อนไขเช็คชื่อของตารางเรียน (fallback เป็น default ถ้าไม่มี override)',
  })
  getSettings(@Param('scheduleId') scheduleId: string) {
    return this.settingsService.getSettings(scheduleId);
  }

  @Put(':scheduleId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'ตั้งค่า/แก้ไขเงื่อนไขเช็คชื่อรายวิชา (อาจารย์ override ได้)',
  })
  upsertSettings(
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpsertAttendanceSettingsDto,
  ) {
    return this.settingsService.upsertSettings(scheduleId, dto);
  }
}
