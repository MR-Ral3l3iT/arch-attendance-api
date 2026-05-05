import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { LeaveRequestStatus } from '@prisma/client';
import { Role } from '@prisma/client';
import { LeaveRequestsService } from './leave-requests.service';
import {
  CreateLeaveRequestDto,
  RejectLeaveRequestDto,
  UpdateLeaveRequestDto,
} from './dto/leave-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('คำขอลา')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'ดูรายการคำขอลาทั้งหมด (paginated, scoped to teacher)',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: LeaveRequestStatus })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'ชื่อ / รหัสนักศึกษา',
  })
  @ApiQuery({
    name: 'classDate',
    required: false,
    description: 'วันที่ขาด (YYYY-MM-DD)',
  })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: LeaveRequestStatus,
    @Query('search') search?: string,
    @Query('classDate') classDate?: string,
  ) {
    const teacherId = user.role === Role.TEACHER ? user.teacherId : undefined;
    return this.leaveRequestsService.findAllPaginated(
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        status,
        search,
        classDate,
      },
      teacherId,
    );
  }

  @Post()
  @Roles(Role.STUDENT)
  @UseInterceptors(
    FileInterceptor('evidence', {
      storage: memoryStorage(),
    }),
  )
  @ApiOperation({
    summary: 'ยื่นคำขอลา (นักศึกษา)',
    description: 'แนบหลักฐานได้ (ไม่บังคับ)',
  })
  @ApiConsumes('multipart/form-data')
  createLeaveRequest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLeaveRequestDto,
    @UploadedFile() evidence?: Express.Multer.File,
  ) {
    return this.leaveRequestsService.createLeaveRequest(user, dto, evidence);
  }

  @Get('pending')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'ดูรายการคำขอลาที่รอการอนุมัติ' })
  findPending(@CurrentUser() user: JwtPayload) {
    const teacherId = user.role === Role.TEACHER ? user.teacherId : undefined;
    return this.leaveRequestsService.findPendingRequests(teacherId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'ดูคำขอลาของตัวเอง (นักศึกษา)' })
  findMine(@CurrentUser() user: JwtPayload) {
    return this.leaveRequestsService.findStudentRequests(user.studentId!);
  }

  @Patch(':id')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'แก้ไขคำขอลาของตัวเอง (เฉพาะสถานะรอพิจารณา)' })
  updateMine(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateLeaveRequestDto,
  ) {
    return this.leaveRequestsService.updateStudentPendingRequest(id, user, dto);
  }

  @Patch(':id/approve')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({
    summary: 'อนุมัติคำขอลา — สถานะเปลี่ยนเป็น LEAVE + บันทึก Audit Log',
  })
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leaveRequestsService.approveLeaveRequest(id, user);
  }

  @Patch(':id/reject')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'ปฏิเสธคำขอลา' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RejectLeaveRequestDto,
  ) {
    return this.leaveRequestsService.rejectLeaveRequest(id, user, dto);
  }
}
