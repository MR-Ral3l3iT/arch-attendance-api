import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/enrollment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('การลงทะเบียนเรียน')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({ summary: 'ผูกนักศึกษาเข้ากลุ่มเรียน' })
  enroll(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.enroll(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ยกเลิกการลงทะเบียนของนักศึกษา' })
  unenroll(@Param('id') id: string) {
    return this.enrollmentsService.unenroll(id);
  }

  @Get()
  @ApiOperation({ summary: 'ดูรายชื่อนักศึกษาที่ลงทะเบียนในกลุ่มเรียน' })
  @ApiQuery({
    name: 'sectionId',
    required: true,
    description: 'รหัสกลุ่มเรียน',
  })
  findBySectionId(@Query('sectionId') sectionId: string) {
    return this.enrollmentsService.findBySectionId(sectionId);
  }
}
