import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SchedulesService } from './schedules.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  CreateEnrollmentDto,
  BulkEnrollmentDto,
} from './dto/schedules.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('ตารางเรียน')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('schedules')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างตารางเรียน' })
  createSchedule(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.createSchedule(dto);
  }

  @Get('schedules')
  @ApiOperation({ summary: 'ดูรายการตารางเรียน' })
  @ApiQuery({ name: 'semesterId', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'sectionId', required: false })
  findAllSchedules(
    @Query('semesterId') semesterId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.schedulesService.findAllSchedules({
      semesterId,
      teacherId,
      sectionId,
    });
  }

  @Get('schedules/my/today')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'ตารางเรียนของนักศึกษา — วันนี้' })
  findMySchedulesToday(@CurrentUser() user: JwtPayload) {
    if (!user.studentId) {
      throw new ForbiddenException('เฉพาะนักศึกษาเท่านั้น');
    }
    return this.schedulesService.findStudentSchedulesToday(user.studentId);
  }

  @Get('schedules/my')
  @Roles(Role.STUDENT)
  @ApiOperation({
    summary: 'ตารางเรียนของนักศึกษา — เทอมปัจจุบัน (หรือระบุ semesterId)',
  })
  @ApiQuery({ name: 'semesterId', required: false })
  findMySchedules(
    @CurrentUser() user: JwtPayload,
    @Query('semesterId') semesterId?: string,
  ) {
    if (!user.studentId) {
      throw new ForbiddenException('เฉพาะนักศึกษาเท่านั้น');
    }
    return this.schedulesService.findStudentSchedules(
      user.studentId,
      semesterId,
    );
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: 'ดูตารางเรียนตาม ID' })
  findOneSchedule(@Param('id') id: string) {
    return this.schedulesService.findOneSchedule(id);
  }

  @Patch('schedules/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขตารางเรียน' })
  updateSchedule(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.updateSchedule(id, dto);
  }

  @Delete('schedules/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบตารางเรียน' })
  removeSchedule(@Param('id') id: string) {
    return this.schedulesService.removeSchedule(id);
  }
}

@ApiTags('การลงทะเบียนเรียน')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ผูกนักศึกษาเข้ากลุ่มเรียน' })
  enroll(@Body() dto: CreateEnrollmentDto) {
    return this.schedulesService.enroll(dto);
  }

  @Post('bulk')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ผูกนักศึกษาเข้ากลุ่มเรียนทีละมาก' })
  bulkEnroll(@Body() dto: BulkEnrollmentDto) {
    return this.schedulesService.bulkEnroll(dto);
  }

  @Get()
  @ApiOperation({ summary: 'ดูรายการลงทะเบียน' })
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  findAll(
    @Query('sectionId') sectionId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.schedulesService.findEnrollments(sectionId, studentId);
  }

  @Delete(':studentId/:sectionId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ยกเลิกการลงทะเบียน' })
  remove(
    @Param('studentId') studentId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.schedulesService.removeEnrollment(studentId, sectionId);
  }
}
