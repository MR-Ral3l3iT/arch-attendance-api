import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CreateSectionDto, UpdateSectionDto } from './dto/courses.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('รายวิชา')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('courses')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างรายวิชา' })
  createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  @Get('courses')
  @ApiOperation({ summary: 'ดูรายการวิชาทั้งหมด' })
  @ApiQuery({ name: 'departmentId', required: false })
  findAllCourses(@Query('departmentId') departmentId?: string) {
    return this.coursesService.findAllCourses(departmentId);
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'ดูรายวิชาตาม ID' })
  findOneCourse(@Param('id') id: string) {
    return this.coursesService.findOneCourse(id);
  }

  @Patch('courses/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขรายวิชา' })
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบรายวิชา' })
  removeCourse(@Param('id') id: string) {
    return this.coursesService.removeCourse(id);
  }

  @Post('sections')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'สร้างกลุ่มเรียน (Section)' })
  createSection(@Body() dto: CreateSectionDto) {
    return this.coursesService.createSection(dto);
  }

  @Get('sections')
  @ApiOperation({ summary: 'ดูรายการกลุ่มเรียน' })
  @ApiQuery({ name: 'courseId', required: false })
  findAllSections(@Query('courseId') courseId?: string) {
    return this.coursesService.findAllSections(courseId);
  }

  @Get('sections/:id')
  @ApiOperation({ summary: 'ดูกลุ่มเรียนตาม ID พร้อมรายชื่อนักศึกษา' })
  findOneSection(@Param('id') id: string) {
    return this.coursesService.findOneSection(id);
  }

  @Patch('sections/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'แก้ไขกลุ่มเรียน' })
  updateSection(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.coursesService.updateSection(id, dto);
  }

  @Delete('sections/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบกลุ่มเรียน' })
  removeSection(@Param('id') id: string) {
    return this.coursesService.removeSection(id);
  }
}
